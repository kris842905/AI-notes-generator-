package com.students.notesgenerator.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.students.notesgenerator.exception.AIProcessingException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@Service
public class SpeechToTextService {

    private static final Logger logger = LoggerFactory.getLogger(SpeechToTextService.class);

    @Value("${gemini.api-key}")
    private String geminiApiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public String transcribeAudio(MultipartFile file) {
        String filename = file.getOriginalFilename();
        logger.info("Transcribing audio file: {}", filename);

        try {
            byte[] fileBytes = file.getBytes();
            String base64Data = Base64.getEncoder().encodeToString(fileBytes);
            String mimeType = file.getContentType();
            if (mimeType == null) {
                mimeType = "audio/mp3"; // Default fallback
            }

            // Construct Gemini REST API payload
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + geminiApiKey;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> inlineData = new HashMap<>();
            inlineData.put("mimeType", mimeType);
            inlineData.put("data", base64Data);

            Map<String, Object> part1 = new HashMap<>();
            part1.put("text", "You are an expert audio transcriber. Transcribe this audio recording into clean, structured text. Do not add any preamble, comments, or introductory text. Just output the transcription.");

            Map<String, Object> part2 = new HashMap<>();
            part2.put("inlineData", inlineData);

            List<Map<String, Object>> parts = Arrays.asList(part1, part2);

            Map<String, Object> contentsObject = new HashMap<>();
            contentsObject.put("parts", parts);

            Map<String, Object> payload = new HashMap<>();
            payload.put("contents", Collections.singletonList(contentsObject));

            String jsonPayload = objectMapper.writeValueAsString(payload);
            HttpEntity<String> entity = new HttpEntity<>(jsonPayload, headers);

            logger.info("Sending transcription request to Gemini API");
            ResponseEntity<String> responseEntity = restTemplate.postForEntity(url, entity, String.class);

            if (!responseEntity.getStatusCode().is2xxSuccessful() || responseEntity.getBody() == null) {
                throw new AIProcessingException("Failed to transcribe audio: Gemini API returned status " + responseEntity.getStatusCode());
            }

            // Parse response
            JsonNode root = objectMapper.readTree(responseEntity.getBody());
            JsonNode candidates = root.path("candidates");
            if (candidates.isArray() && candidates.size() > 0) {
                JsonNode textNode = candidates.get(0)
                        .path("content")
                        .path("parts")
                        .get(0)
                        .path("text");
                return textNode.asText().trim();
            }

            throw new AIProcessingException("Failed to extract transcription text from Gemini API response");

        } catch (Exception e) {
            logger.error("Error transcribing audio file", e);
            throw new AIProcessingException("Audio transcription failed: " + e.getMessage(), e);
        }
    }
}
