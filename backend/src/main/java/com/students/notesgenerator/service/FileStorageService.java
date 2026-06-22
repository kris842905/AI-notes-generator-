package com.students.notesgenerator.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.students.notesgenerator.exception.AIProcessingException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
public class FileStorageService {

    private static final Logger logger = LoggerFactory.getLogger(FileStorageService.class);

    @Autowired
    private Cloudinary cloudinary;

    public String uploadFile(MultipartFile file) {
        try {
            logger.info("Uploading file '{}' to Cloudinary", file.getOriginalFilename());
            Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(),
                    ObjectUtils.asMap("resource_type", "auto"));
            
            String secureUrl = (String) uploadResult.get("secure_url");
            logger.info("File uploaded successfully. Secure URL: {}", secureUrl);
            return secureUrl;
        } catch (IOException e) {
            logger.error("Failed to upload file to Cloudinary", e);
            throw new AIProcessingException("Failed to upload file to Cloudinary: " + e.getMessage(), e);
        }
    }
}
