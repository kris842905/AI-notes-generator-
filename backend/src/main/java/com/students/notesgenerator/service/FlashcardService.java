package com.students.notesgenerator.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.students.notesgenerator.dto.response.FlashcardResponse;
import com.students.notesgenerator.entity.Flashcard;
import com.students.notesgenerator.entity.Note;
import com.students.notesgenerator.entity.User;
import com.students.notesgenerator.exception.AIProcessingException;
import com.students.notesgenerator.exception.ResourceNotFoundException;
import com.students.notesgenerator.repository.FlashcardRepository;
import com.students.notesgenerator.repository.NoteRepository;
import dev.langchain4j.model.googleai.GoogleAiGeminiChatModel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class FlashcardService {

    private static final Logger logger = LoggerFactory.getLogger(FlashcardService.class);

    @Autowired
    private FlashcardRepository flashcardRepository;

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private GoogleAiGeminiChatModel chatModel;

    @Autowired
    private NoteService noteService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public List<FlashcardResponse> getOrGenerateFlashcards(Long noteId, User user) {
        Note note = noteRepository.findByIdAndUser(noteId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Note", "id", noteId));

        List<Flashcard> existing = flashcardRepository.findByNote(note);
        if (!existing.isEmpty()) {
            return existing.stream().map(this::mapToResponse).toList();
        }

        return generateNewFlashcards(note, user);
    }

    private List<FlashcardResponse> generateNewFlashcards(Note note, User user) {
        logger.info("Generating new Flashcards for Note ID: {}", note.getId());

        String prompt = """
                Generate a list of 8 Flashcards based on the text below. Flashcards should test key facts, terms, definitions, or core concepts.
                
                You must return ONLY a JSON array containing the flashcards. Do not add any markdown wrapper like ```json or ```. Output raw valid JSON only.
                Each JSON object in the array must strictly have the following fields:
                - question (String - the front side, e.g. a question or a term)
                - answer (String - the back side, e.g. the answer or the definition)
                
                Text Content:
                %s
                """;

        String formattedPrompt = String.format(prompt, note.getTextContent());
        String aiResponse;
        try {
            aiResponse = chatModel.generate(formattedPrompt);
        } catch (Exception e) {
            logger.error("Failed to generate Flashcards with Gemini", e);
            throw new AIProcessingException("Failed to generate Flashcards: " + e.getMessage(), e);
        }

        aiResponse = cleanJsonResponse(aiResponse);

        try {
            List<Map<String, String>> rawFlashcards = objectMapper.readValue(aiResponse, new TypeReference<>() {});
            List<Flashcard> flashcardsToSave = new ArrayList<>();

            for (Map<String, String> item : rawFlashcards) {
                Flashcard flashcard = new Flashcard();
                flashcard.setNote(note);
                flashcard.setQuestion(item.get("question"));
                flashcard.setAnswer(item.get("answer"));
                flashcardsToSave.add(flashcard);
            }

            List<Flashcard> saved = flashcardRepository.saveAll(flashcardsToSave);

            // Update streak activity
            noteService.updateStudyStreak(user, "VIEW_FLASHCARDS");

            return saved.stream().map(this::mapToResponse).toList();
        } catch (Exception e) {
            logger.error("Failed to parse Flashcards JSON: " + aiResponse, e);
            throw new AIProcessingException("Failed to process Flashcards response: " + e.getMessage(), e);
        }
    }

    private String cleanJsonResponse(String response) {
        String clean = response.trim();
        if (clean.startsWith("```json")) {
            clean = clean.substring(7);
        } else if (clean.startsWith("```")) {
            clean = clean.substring(3);
        }
        if (clean.endsWith("```")) {
            clean = clean.substring(0, clean.length() - 3);
        }
        return clean.trim();
    }

    private FlashcardResponse mapToResponse(Flashcard flashcard) {
        FlashcardResponse res = new FlashcardResponse();
        res.setId(flashcard.getId());
        res.setNoteId(flashcard.getNote().getId());
        res.setQuestion(flashcard.getQuestion());
        res.setAnswer(flashcard.getAnswer());
        return res;
    }
}
