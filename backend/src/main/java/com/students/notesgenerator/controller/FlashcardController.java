package com.students.notesgenerator.controller;

import com.students.notesgenerator.dto.response.FlashcardResponse;
import com.students.notesgenerator.entity.User;
import com.students.notesgenerator.exception.ResourceNotFoundException;
import com.students.notesgenerator.repository.UserRepository;
import com.students.notesgenerator.security.UserPrincipal;
import com.students.notesgenerator.service.FlashcardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/flashcards")
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Flashcard Generator Module", description = "Endpoints for generating active recall flashcards")
public class FlashcardController {

    @Autowired
    private FlashcardService flashcardService;

    @Autowired
    private UserRepository userRepository;

    private User getCurrentUser(UserPrincipal principal) {
        return userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", principal.getId()));
    }

    @GetMapping
    @Operation(summary = "Get or generate active-recall flashcards for a note")
    public ResponseEntity<List<FlashcardResponse>> getFlashcards(
            @RequestParam("noteId") Long noteId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        
        User user = getCurrentUser(userPrincipal);
        List<FlashcardResponse> response = flashcardService.getOrGenerateFlashcards(noteId, user);
        return ResponseEntity.ok(response);
    }
}
