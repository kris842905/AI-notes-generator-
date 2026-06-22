package com.students.notesgenerator.service;

import com.students.notesgenerator.dto.response.ChatResponse;
import com.students.notesgenerator.entity.Note;
import com.students.notesgenerator.entity.NoteChunk;
import com.students.notesgenerator.entity.User;
import com.students.notesgenerator.exception.AIProcessingException;
import com.students.notesgenerator.exception.ResourceNotFoundException;
import com.students.notesgenerator.repository.NoteChunkRepository;
import com.students.notesgenerator.repository.NoteRepository;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.googleai.GoogleAiGeminiChatModel;
import dev.langchain4j.model.googleai.GoogleAiEmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingMatch;
import dev.langchain4j.store.embedding.chroma.ChromaEmbeddingStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private static final Logger logger = LoggerFactory.getLogger(ChatService.class);

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private NoteChunkRepository noteChunkRepository;

    @Autowired
    private GoogleAiGeminiChatModel chatModel;

    @Autowired
    private GoogleAiEmbeddingModel embeddingModel;

    @Autowired(required = false)
    private ChromaEmbeddingStore embeddingStore;

    @Autowired
    private NoteService noteService;

    @Transactional
    public ChatResponse chatWithNote(Long noteId, String userQuestion, User user) {
        Note note = noteRepository.findByIdAndUser(noteId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Note", "id", noteId));

        logger.info("Executing RAG chat with Note ID: {} for user query: '{}'", noteId, userQuestion);

        List<NoteChunk> contextChunks = new ArrayList<>();
        List<ChatResponse.SourceChunkDto> sources = new ArrayList<>();

        try {
            if (embeddingStore == null) {
                throw new RuntimeException("ChromaDB is offline or not configured.");
            }

            // 1. Generate query embedding
            Embedding queryEmbedding = embeddingModel.embed(userQuestion).content();

            // 2. Perform similarity search in ChromaDB (retrieve top 15 candidates)
            List<EmbeddingMatch<TextSegment>> matches = embeddingStore.findRelevant(queryEmbedding, 15, 0.0);

            // 3. Filter candidates belonging to this specific Note
            List<EmbeddingMatch<TextSegment>> noteMatches = matches.stream()
                    .filter(match -> {
                        TextSegment segment = match.embedded();
                        return segment != null && segment.metadata() != null &&
                                note.getId().equals(segment.metadata().getLong("noteId"));
                    })
                    .limit(4)
                    .toList();

            logger.info("Vector store returned {} matching chunks for this note", noteMatches.size());

            // 4. Map vector segments back to our source models
            for (EmbeddingMatch<TextSegment> match : noteMatches) {
                ChatResponse.SourceChunkDto source = new ChatResponse.SourceChunkDto(
                        match.embedded().text(),
                        -1 // index not stored in vector metadata directly
                );
                sources.add(source);
            }

            // Extract context text
            String vectorContext = noteMatches.stream()
                    .map(m -> m.embedded().text())
                    .collect(Collectors.joining("\n---\n"));

            if (vectorContext.isBlank()) {
                throw new RuntimeException("No relevant chunks found in vector store.");
            }

            return generateAiResponse(note, userQuestion, vectorContext, sources, user);

        } catch (Exception e) {
            logger.warn("ChromaDB RAG lookup failed or was empty: {}. Falling back to database chunk context retrieval.", e.getMessage());
            
            // Database-backed fallback: fetch chunks directly from MySQL
            List<NoteChunk> dbChunks = noteChunkRepository.findByNote(note);
            
            // Limit to first 4 chunks for context window safety
            List<NoteChunk> subList = dbChunks.stream().limit(4).toList();
            String dbContext = subList.stream()
                    .map(NoteChunk::getContent)
                    .collect(Collectors.joining("\n---\n"));

            for (NoteChunk chunk : subList) {
                sources.add(new ChatResponse.SourceChunkDto(chunk.getContent(), chunk.getChunkIndex()));
            }

            return generateAiResponse(note, userQuestion, dbContext, sources, user);
        }
    }

    private ChatResponse generateAiResponse(Note note, String question, String context, List<ChatResponse.SourceChunkDto> sources, User user) {
        String systemInstructions = """
                You are a highly helpful, intelligent AI Student Tutor.
                Your task is to answer the student's question based strictly on the provided context snippets extracted from their notes.
                If the answer cannot be found or inferred from the snippets, try to answer the question generally using your academic knowledge but clearly state that it was not directly found in their uploaded notes.
                Keep your response structured, well-formatted (using markdown), and easy to read.
                
                Note Title: %s
                
                Context Snippets:
                ---
                %s
                ---
                """;

        String formattedPrompt = String.format(systemInstructions, note.getTitle(), context) + "\n\nStudent Question: " + question;

        String reply;
        try {
            reply = chatModel.generate(formattedPrompt);
        } catch (Exception e) {
            logger.error("Failed to generate answer with Gemini", e);
            throw new AIProcessingException("AI chat response generation failed: " + e.getMessage(), e);
        }

        // Update student study streak logs
        noteService.updateStudyStreak(user, "CHAT_NOTE");

        return new ChatResponse(reply, sources);
    }
}
