package com.students.notesgenerator.service;

import com.students.notesgenerator.dto.response.SummaryResponse;
import com.students.notesgenerator.entity.Note;
import com.students.notesgenerator.entity.Summary;
import com.students.notesgenerator.entity.User;
import com.students.notesgenerator.exception.ResourceNotFoundException;
import com.students.notesgenerator.repository.NoteRepository;
import com.students.notesgenerator.repository.SummaryRepository;
import dev.langchain4j.model.googleai.GoogleAiGeminiChatModel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SummaryService {

    private static final Logger logger = LoggerFactory.getLogger(SummaryService.class);

    @Autowired
    private SummaryRepository summaryRepository;

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private GoogleAiGeminiChatModel chatModel;

    @Autowired
    private NoteService noteService;

    @Transactional
    public SummaryResponse getOrGenerateSummary(Long noteId, String mode, User user) {
        Note note = noteRepository.findByIdAndUser(noteId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Note", "id", noteId));

        String upperMode = mode.toUpperCase();
        if (!List.of("SMALL", "MEDIUM", "DETAILED", "EXAM").contains(upperMode)) {
            throw new IllegalArgumentException("Invalid summary mode: " + mode);
        }

        // Cache lookup: check if already exists
        return summaryRepository.findByNoteAndMode(note, upperMode)
                .map(this::mapToResponse)
                .orElseGet(() -> generateNewSummary(note, upperMode, user));
    }

    private SummaryResponse generateNewSummary(Note note, String mode, User user) {
        logger.info("Cache miss. Generating new summary for Note ID: {} in Mode: {}", note.getId(), mode);

        String systemPrompt = switch (mode) {
            case "SMALL" -> "You are an expert student assistant. Generate a highly concise summary of the following text, focusing on the core concept. Keep it between 100-150 words.";
            case "MEDIUM" -> "You are an expert student assistant. Generate a medium-length summary of the following text. Use bullet points for key concepts, keep it structured, and limit it to 250-350 words.";
            case "DETAILED" -> "You are an expert academic advisor. Generate a highly detailed, comprehensive study summary. Breakdown concepts into subheadings, expand on complex details, and write it in a clear textbook format.";
            case "EXAM" -> "You are an exam evaluator. Extract core definitions, list any important formulas/equations, outline potential exam questions with brief answers, and compile critical cheat-sheet notes from the text.";
            default -> throw new IllegalArgumentException("Invalid mode: " + mode);
        };

        String userPrompt = "Text content to summarize:\n\n" + note.getTextContent();

        // Call Gemini Model
        String generatedContent;
        try {
            // Using system messages or direct context prompt
            generatedContent = chatModel.generate(systemPrompt + "\n\n" + userPrompt);
        } catch (Exception e) {
            logger.error("Failed to generate summary with Gemini", e);
            throw new RuntimeException("AI Summarization failed: " + e.getMessage(), e);
        }

        // Persist Summary
        Summary summary = new Summary();
        summary.setNote(note);
        summary.setContent(generatedContent);
        summary.setMode(mode);
        summary = summaryRepository.save(summary);

        // Update Study Streak
        noteService.updateStudyStreak(user, "VIEW_SUMMARY");

        return mapToResponse(summary);
    }

    @Transactional(readOnly = true)
    public List<SummaryResponse> getAllSummariesForNote(Long noteId, User user) {
        Note note = noteRepository.findByIdAndUser(noteId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Note", "id", noteId));

        return summaryRepository.findByNote(note).stream()
                .map(this::mapToResponse)
                .toList();
    }

    private SummaryResponse mapToResponse(Summary summary) {
        SummaryResponse res = new SummaryResponse();
        res.setId(summary.getId());
        res.setNoteId(summary.getNote().getId());
        res.setContent(summary.getContent());
        res.setMode(summary.getMode());
        res.setCreatedAt(summary.getCreatedAt());
        return res;
    }
}
