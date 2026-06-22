package com.students.notesgenerator.controller;

import com.students.notesgenerator.dto.response.NoteResponse;
import com.students.notesgenerator.entity.User;
import com.students.notesgenerator.exception.ResourceNotFoundException;
import com.students.notesgenerator.repository.UserRepository;
import com.students.notesgenerator.security.UserPrincipal;
import com.students.notesgenerator.service.NoteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/notes")
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Notes Management", description = "Endpoints for uploading, viewing, bookmarking, and deleting notes")
public class NoteController {

    @Autowired
    private NoteService noteService;

    @Autowired
    private UserRepository userRepository;

    private User getCurrentUser(UserPrincipal principal) {
        return userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", principal.getId()));
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload and automatically parse a study note file (PDF, DOCX, PPTX, TXT, Image or Audio)")
    public ResponseEntity<NoteResponse> uploadNote(
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        
        User user = getCurrentUser(userPrincipal);
        NoteResponse response = noteService.uploadAndProcessNote(file, title, description, user);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @Operation(summary = "Get all notes uploaded by the current student with pagination")
    public ResponseEntity<Page<NoteResponse>> getAllNotes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        User user = getCurrentUser(userPrincipal);
        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<NoteResponse> notes = noteService.getAllNotesForUser(user, pageable);
        return ResponseEntity.ok(notes);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get detailed content of a note by its ID")
    public ResponseEntity<NoteResponse> getNoteById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        
        User user = getCurrentUser(userPrincipal);
        NoteResponse note = noteService.getNoteById(id, user);
        return ResponseEntity.ok(note);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an uploaded note and clean up its database records")
    public ResponseEntity<?> deleteNote(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        
        User user = getCurrentUser(userPrincipal);
        noteService.deleteNote(id, user);
        return ResponseEntity.ok().body(java.util.Map.of("message", "Note deleted successfully"));
    }

    @PostMapping("/{id}/bookmark")
    @Operation(summary = "Toggle bookmark status for a study note")
    public ResponseEntity<java.util.Map<String, Boolean>> toggleBookmark(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        
        User user = getCurrentUser(userPrincipal);
        boolean bookmarked = noteService.toggleBookmark(id, user);
        return ResponseEntity.ok(java.util.Map.of("bookmarked", bookmarked));
    }

    @GetMapping("/bookmarks")
    @Operation(summary = "Retrieve all bookmarked notes for the student")
    public ResponseEntity<List<NoteResponse>> getBookmarks(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        
        User user = getCurrentUser(userPrincipal);
        List<NoteResponse> bookmarkedNotes = noteService.getBookmarkedNotes(user);
        return ResponseEntity.ok(bookmarkedNotes);
    }
}
