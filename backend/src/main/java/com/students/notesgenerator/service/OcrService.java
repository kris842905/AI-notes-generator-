package com.students.notesgenerator.service;

import dev.langchain4j.data.message.ImageContent;
import dev.langchain4j.data.message.TextContent;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.model.googleai.GoogleAiGeminiChatModel;
import dev.langchain4j.model.output.Response;
import net.sourceforge.tess4j.Tesseract;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.util.Base64;

@Service
public class OcrService {

    private static final Logger logger = LoggerFactory.getLogger(OcrService.class);

    @Value("${tesseract.datapath}")
    private String tesseractDatapath;

    @Autowired
    private GoogleAiGeminiChatModel geminiChatModel;

    public String extractTextFromImage(MultipartFile file) {
        logger.info("Attempting OCR on image: {}", file.getOriginalFilename());
        
        try {
            // Try local Tesseract OCR first
            return runTesseractOcr(file);
        } catch (Throwable t) {
            logger.warn("Local Tesseract OCR failed (likely missing native binaries or data path). Falling back to Gemini Multimodal OCR... Error: {}", t.getMessage());
            return runGeminiMultimodalOcr(file);
        }
    }

    private String runTesseractOcr(MultipartFile file) throws Exception {
        Tesseract tesseract = new Tesseract();
        
        // Ensure datapath directory exists before setting it, else fallback to standard pathing
        File datapathFile = new File(tesseractDatapath);
        if (datapathFile.exists()) {
            tesseract.setDatapath(tesseractDatapath);
        }
        
        tesseract.setLanguage("eng");

        try (ByteArrayInputStream bis = new ByteArrayInputStream(file.getBytes())) {
            BufferedImage image = ImageIO.read(bis);
            if (image == null) {
                throw new IllegalArgumentException("Invalid image file");
            }
            return tesseract.doOCR(image);
        }
    }

    private String runGeminiMultimodalOcr(MultipartFile file) {
        try {
            byte[] imageBytes = file.getBytes();
            String base64Image = Base64.getEncoder().encodeToString(imageBytes);
            String mimeType = file.getContentType();
            if (mimeType == null) {
                mimeType = "image/png"; // default fallback
            }

            logger.info("Running Gemini OCR for image of type {}", mimeType);

            UserMessage userMessage = UserMessage.from(
                    TextContent.from("Extract all text from this image. Do not add any explanation or preamble. Simply return the text written in the image, formatted cleanly. If there is no text, return an empty string."),
                    ImageContent.from(base64Image, mimeType)
            );

            Response<AiMessage> response = geminiChatModel.generate(userMessage);
            return response.content().text();
        } catch (Exception e) {
            logger.error("Gemini Multimodal OCR also failed", e);
            throw new RuntimeException("OCR extraction failed completely: " + e.getMessage(), e);
        }
    }
}
