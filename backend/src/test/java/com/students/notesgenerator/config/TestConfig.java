package com.students.notesgenerator.config;

import dev.langchain4j.model.googleai.GoogleAiGeminiChatModel;
import dev.langchain4j.model.googleai.GoogleAiEmbeddingModel;
import dev.langchain4j.store.embedding.chroma.ChromaEmbeddingStore;
import org.mockito.Mockito;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

@TestConfiguration
public class TestConfig {

    @Bean
    @Primary
    public GoogleAiGeminiChatModel mockChatModel() {
        return Mockito.mock(GoogleAiGeminiChatModel.class);
    }

    @Bean
    @Primary
    public GoogleAiEmbeddingModel mockEmbeddingModel() {
        return Mockito.mock(GoogleAiEmbeddingModel.class);
    }

    @Bean
    @Primary
    public ChromaEmbeddingStore mockEmbeddingStore() {
        return Mockito.mock(ChromaEmbeddingStore.class);
    }
}
