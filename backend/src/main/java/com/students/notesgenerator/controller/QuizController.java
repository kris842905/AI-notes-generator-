package com.students.notesgenerator.controller;

import com.students.notesgenerator.dto.request.QuizSubmitRequest;
import com.students.notesgenerator.dto.response.QuizResponse;
import com.students.notesgenerator.dto.response.QuizResultResponse;
import com.students.notesgenerator.entity.QuizAttempt;
import com.students.notesgenerator.entity.User;
import com.students.notesgenerator.exception.ResourceNotFoundException;
import com.students.notesgenerator.repository.UserRepository;
import com.students.notesgenerator.security.UserPrincipal;
import com.students.notesgenerator.service.QuizService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/quizzes")
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Quiz Management Module", description = "Endpoints for creating quizzes, submitting answers, and tracking attempt histories")
public class QuizController {

    @Autowired
    private QuizService quizService;

    @Autowired
    private UserRepository userRepository;

    private User getCurrentUser(UserPrincipal principal) {
        return userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", principal.getId()));
    }

    @GetMapping
    @Operation(summary = "Get or generate a custom quiz for a note (answers and explanations are hidden)")
    public ResponseEntity<QuizResponse> getQuiz(
            @RequestParam("noteId") Long noteId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        
        User user = getCurrentUser(userPrincipal);
        QuizResponse response = quizService.getOrGenerateQuiz(noteId, user);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/submit")
    @Operation(summary = "Submit quiz selections, calculate score, log attempt and return explanations")
    public ResponseEntity<QuizResultResponse> submitQuiz(
            @PathVariable Long id,
            @Valid @RequestBody QuizSubmitRequest submitRequest,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        
        User user = getCurrentUser(userPrincipal);
        QuizResultResponse response = quizService.submitQuiz(id, submitRequest, user);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/attempts")
    @Operation(summary = "Get historical quiz attempts for the student")
    public ResponseEntity<List<QuizAttempt>> getAttemptHistory(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        
        User user = getCurrentUser(userPrincipal);
        List<QuizAttempt> attempts = quizService.getAttemptHistory(user);
        return ResponseEntity.ok(attempts);
    }
}
