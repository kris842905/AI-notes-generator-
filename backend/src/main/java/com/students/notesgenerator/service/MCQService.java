package com.students.notesgenerator.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.students.notesgenerator.dto.response.MCQResponse;
import com.students.notesgenerator.entity.MCQ;
import com.students.notesgenerator.entity.Note;
import com.students.notesgenerator.entity.User;
import com.students.notesgenerator.exception.AIProcessingException;
import com.students.notesgenerator.exception.ResourceNotFoundException;
import com.students.notesgenerator.repository.MCQRepository;
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
public class MCQService {

    private static final Logger logger = LoggerFactory.getLogger(MCQService.class);

    @Autowired
    private MCQRepository mcqRepository;

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private GoogleAiGeminiChatModel chatModel;

    @Autowired
    private NoteService noteService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public List<MCQResponse> getOrGenerateMCQs(Long noteId, String difficulty, User user) {
        Note note = noteRepository.findByIdAndUser(noteId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Note", "id", noteId));

        String upperDiff = difficulty.toUpperCase();
        if (!List.of("EASY", "MEDIUM", "HARD").contains(upperDiff)) {
            throw new IllegalArgumentException("Invalid difficulty level: " + difficulty);
        }

        List<MCQ> existing = mcqRepository.findByNoteAndDifficulty(note, upperDiff);
        if (!existing.isEmpty()) {
            return existing.stream().map(this::mapToResponse).toList();
        }

        return generateNewMCQs(note, upperDiff, user);
    }

    private List<MCQResponse> generateNewMCQs(Note note, String difficulty, User user) {
        logger.info("Generating new MCQs for Note ID: {} in Difficulty: {}", note.getId(), difficulty);

        String prompt = """
                Generate a list of 5 Multiple Choice Questions (MCQs) based on the text below.
                Difficulty Level: %s
                
                You must return ONLY a JSON array containing the questions. Do not add any markdown wrapper like ```json or ```. Output raw valid JSON only.
                Each JSON object in the array must strictly have the following fields:
                - question (String)
                - optionA (String)
                - optionB (String)
                - optionC (String)
                - optionD (String)
                - correctAnswer (String: must be one of 'A', 'B', 'C', 'D')
                - explanation (String)
                
                Text Content:
                %s
                """;

        String formattedPrompt = String.format(prompt, difficulty, note.getTextContent());
        String aiResponse;
        try {
            aiResponse = chatModel.generate(formattedPrompt);
        } catch (Exception e) {
            logger.error("Failed to generate MCQs with Gemini", e);
            throw new AIProcessingException("Failed to generate MCQs: " + e.getMessage(), e);
        }

        // Clean up markdown markers if any are present in the response
        aiResponse = cleanJsonResponse(aiResponse);

        try {
            List<Map<String, String>> rawMcqs = objectMapper.readValue(aiResponse, new TypeReference<>() {});
            List<MCQ> mcqsToSave = new ArrayList<>();

            for (Map<String, String> item : rawMcqs) {
                MCQ mcq = new MCQ();
                mcq.setNote(note);
                mcq.setQuestion(item.get("question"));
                mcq.setOptionA(item.get("optionA"));
                mcq.setOptionB(item.get("optionB"));
                mcq.setOptionC(item.get("optionC"));
                mcq.setOptionD(item.get("optionD"));
                mcq.setCorrectAnswer(item.get("correctAnswer").toUpperCase());
                mcq.setExplanation(item.get("explanation"));
                mcq.setDifficulty(difficulty);
                mcqsToSave.add(mcq);
            }

            List<MCQ> saved = mcqRepository.saveAll(mcqsToSave);

            // Update streak activity
            noteService.updateStudyStreak(user, "GENERATE_MCQ");

            return saved.stream().map(this::mapToResponse).toList();
        } catch (Exception e) {
            logger.error("Failed to parse MCQs JSON: " + aiResponse, e);
            throw new AIProcessingException("Failed to process MCQs response due to invalid formatting: " + e.getMessage(), e);
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

    private MCQResponse mapToResponse(MCQ mcq) {
        MCQResponse res = new MCQResponse();
        res.setId(mcq.getId());
        res.setNoteId(mcq.getNote().getId());
        res.setQuestion(mcq.getQuestion());
        res.setOptionA(mcq.getOptionA());
        res.setOptionB(mcq.getOptionB());
        res.setOptionC(mcq.getOptionC());
        res.setOptionD(mcq.getOptionD());
        res.setCorrectAnswer(mcq.getCorrectAnswer());
        res.setExplanation(mcq.getExplanation());
        res.setDifficulty(mcq.getDifficulty());
        return res;
    }
}
