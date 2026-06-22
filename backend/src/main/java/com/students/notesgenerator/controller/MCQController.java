package com.students.notesgenerator.controller;

import com.students.notesgenerator.dto.response.MCQResponse;
import com.students.notesgenerator.entity.User;
import com.students.notesgenerator.exception.ResourceNotFoundException;
import com.students.notesgenerator.repository.UserRepository;
import com.students.notesgenerator.security.UserPrincipal;
import com.students.notesgenerator.service.MCQService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mcqs")
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "MCQ Generator Module", description = "Endpoints for generating study MCQs")
public class MCQController {

    @Autowired
    private MCQService mcqService;

    @Autowired
    private UserRepository userRepository;

    private User getCurrentUser(UserPrincipal principal) {
        return userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", principal.getId()));
    }

    @GetMapping
    @Operation(summary = "Get or generate multiple choice questions (MCQs) for a note by difficulty (EASY, MEDIUM, HARD)")
    public ResponseEntity<List<MCQResponse>> getMCQs(
            @RequestParam("noteId") Long noteId,
            @RequestParam(value = "difficulty", defaultValue = "MEDIUM") String difficulty,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        
        User user = getCurrentUser(userPrincipal);
        List<MCQResponse> response = mcqService.getOrGenerateMCQs(noteId, difficulty, user);
        return ResponseEntity.ok(response);
    }
}
