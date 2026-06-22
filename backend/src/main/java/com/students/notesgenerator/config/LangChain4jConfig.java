package com.students.notesgenerator.config;

import dev.langchain4j.model.googleai.GoogleAiGeminiChatModel;
import dev.langchain4j.model.googleai.GoogleAiEmbeddingModel;
import dev.langchain4j.store.embedding.chroma.ChromaEmbeddingStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("!test")
public class LangChain4jConfig {

    private static final Logger logger = LoggerFactory.getLogger(LangChain4jConfig.class);

    @Value("${gemini.api-key}")
    private String geminiApiKey;

    @Value("${chromadb.url}")
    private String chromaUrl;

    @Bean
    public GoogleAiGeminiChatModel geminiChatModel() {
        if ("demo_gemini_key".equals(geminiApiKey) || geminiApiKey.isBlank()) {
            logger.warn("Gemini API key is not set! AI responses will fail. Please provide a valid GEMINI_API_KEY environment variable.");
        }
        return GoogleAiGeminiChatModel.builder()
                .apiKey(geminiApiKey)
                .modelName("gemini-1.5-flash")
                .temperature(0.2)
                .build();
    }

    @Bean
    public GoogleAiEmbeddingModel geminiEmbeddingModel() {
        return GoogleAiEmbeddingModel.builder()
                .apiKey(geminiApiKey)
                .modelName("embedding-001")
                .build();
    }

    @Bean
    public ChromaEmbeddingStore embeddingStore() {
        logger.info("Connecting to ChromaDB at: {}", chromaUrl);
        try {
            return ChromaEmbeddingStore.builder()
                    .baseUrl(chromaUrl)
                    .collectionName("student_notes")
                    .build();
        } catch (Exception e) {
            logger.warn("ChromaDB connection failed during initialization: {}. Vector search will be disabled, falling back to database chunks.", e.getMessage());
            return null;
        }
    }
}
