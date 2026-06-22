package com.students.notesgenerator.controller;

import com.students.notesgenerator.dto.response.NotificationResponse;
import com.students.notesgenerator.entity.User;
import com.students.notesgenerator.exception.ResourceNotFoundException;
import com.students.notesgenerator.repository.UserRepository;
import com.students.notesgenerator.security.UserPrincipal;
import com.students.notesgenerator.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Notification System Module", description = "Endpoints for user alerts")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    private User getCurrentUser(UserPrincipal principal) {
        return userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", principal.getId()));
    }

    @GetMapping
    @Operation(summary = "Get all alerts sorted by newest")
    public ResponseEntity<List<NotificationResponse>> getNotifications(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        
        User user = getCurrentUser(userPrincipal);
        List<NotificationResponse> response = notificationService.getUserNotifications(user);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Get count of unread notifications")
    public ResponseEntity<java.util.Map<String, Long>> getUnreadCount(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        
        User user = getCurrentUser(userPrincipal);
        long count = notificationService.getUnreadCount(user);
        return ResponseEntity.ok(java.util.Map.of("unreadCount", count));
    }

    @PostMapping("/mark-read")
    @Operation(summary = "Mark all notifications as read")
    public ResponseEntity<?> markAllAsRead(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        
        User user = getCurrentUser(userPrincipal);
        notificationService.markAllAsRead(user);
        return ResponseEntity.ok(java.util.Map.of("message", "All notifications marked as read"));
    }
}
