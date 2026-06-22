package com.students.notesgenerator.controller;

import com.students.notesgenerator.dto.response.SummaryResponse;
import com.students.notesgenerator.entity.User;
import com.students.notesgenerator.exception.ResourceNotFoundException;
import com.students.notesgenerator.repository.UserRepository;
import com.students.notesgenerator.security.UserPrincipal;
import com.students.notesgenerator.service.SummaryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/summaries")
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Summarizer Module", description = "Endpoints for generating note summaries")
public class SummaryController {

    @Autowired
    private SummaryService summaryService;

    @Autowired
    private UserRepository userRepository;

    private User getCurrentUser(UserPrincipal principal) {
        return userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", principal.getId()));
    }

    @GetMapping
    @Operation(summary = "Get or generate a summary of a note by mode (SMALL, MEDIUM, DETAILED, EXAM)")
    public ResponseEntity<SummaryResponse> getSummary(
            @RequestParam("noteId") Long noteId,
            @RequestParam(value = "mode", defaultValue = "MEDIUM") String mode,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        
        User user = getCurrentUser(userPrincipal);
        SummaryResponse response = summaryService.getOrGenerateSummary(noteId, mode, user);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/note/{noteId}")
    @Operation(summary = "Get all summaries created for a specific note")
    public ResponseEntity<List<SummaryResponse>> getAllSummariesForNote(
            @PathVariable Long noteId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        
        User user = getCurrentUser(userPrincipal);
        List<SummaryResponse> response = summaryService.getAllSummariesForNote(noteId, user);
        return ResponseEntity.ok(response);
    }
}
