package com.students.notesgenerator.controller;

import com.students.notesgenerator.dto.request.ChatRequest;
import com.students.notesgenerator.dto.response.ChatResponse;
import com.students.notesgenerator.entity.User;
import com.students.notesgenerator.exception.ResourceNotFoundException;
import com.students.notesgenerator.repository.UserRepository;
import com.students.notesgenerator.security.UserPrincipal;
import com.students.notesgenerator.service.ChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "AI RAG Chat Module", description = "Endpoints for context-aware chats over student notes")
public class ChatController {

    @Autowired
    private ChatService chatService;

    @Autowired
    private UserRepository userRepository;

    private User getCurrentUser(UserPrincipal principal) {
        return userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", principal.getId()));
    }

    @PostMapping
    @Operation(summary = "Ask a question about a study note. Uses semantic vector search (RAG) to generate a contextual answer.")
    public ResponseEntity<ChatResponse> chatWithNote(
            @RequestParam("noteId") Long noteId,
            @Valid @RequestBody ChatRequest chatRequest,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        
        User user = getCurrentUser(userPrincipal);
        ChatResponse response = chatService.chatWithNote(noteId, chatRequest.getMessage(), user);
        return ResponseEntity.ok(response);
    }
}
