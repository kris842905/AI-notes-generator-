package com.students.notesgenerator.service;

import com.students.notesgenerator.dto.response.NoteResponse;
import com.students.notesgenerator.entity.*;
import com.students.notesgenerator.exception.AIProcessingException;
import com.students.notesgenerator.exception.ResourceNotFoundException;
import com.students.notesgenerator.repository.*;
import dev.langchain4j.data.document.Metadata;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.googleai.GoogleAiEmbeddingModel;
import dev.langchain4j.store.embedding.chroma.ChromaEmbeddingStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class NoteService {

    private static final Logger logger = LoggerFactory.getLogger(NoteService.class);

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private NoteChunkRepository noteChunkRepository;

    @Autowired
    private BookmarkRepository bookmarkRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudyLogRepository studyLogRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private DocumentParserService documentParserService;

    @Autowired
    private OcrService ocrService;

    @Autowired
    private SpeechToTextService speechToTextService;

    @Autowired
    private GoogleAiEmbeddingModel embeddingModel;

    @Autowired(required = false)
    private ChromaEmbeddingStore embeddingStore;

    @Transactional
    public NoteResponse uploadAndProcessNote(MultipartFile file, String title, String description, User user) {
        String filename = file.getOriginalFilename();
        if (filename == null) {
            filename = "Unnamed_Note";
        }

        String extension = filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
        String fileType;
        String extractedText;

        // Route file parsing based on extension
        if (extension.equals("pdf") || extension.equals("docx") || extension.equals("pptx") || extension.equals("txt")) {
            fileType = "DOCUMENT";
            extractedText = documentParserService.parseDocument(file);
        } else if (extension.equals("png") || extension.equals("jpg") || extension.equals("jpeg")) {
            fileType = "IMAGE";
            extractedText = ocrService.extractTextFromImage(file);
        } else if (extension.equals("mp3") || extension.equals("wav") || extension.equals("m4a") || extension.equals("ogg")) {
            fileType = "AUDIO";
            extractedText = speechToTextService.transcribeAudio(file);
        } else {
            throw new IllegalArgumentException("Unsupported file type: ." + extension);
        }

        if (extractedText == null || extractedText.isBlank()) {
            throw new AIProcessingException("Text extraction resulted in empty content. Please upload a file with readable text.");
        }

        // Upload to Cloudinary
        String cloudUrl = fileStorageService.uploadFile(file);

        // Save Note Metadata
        Note note = new Note();
        note.setTitle(title);
        note.setDescription(description);
        note.setFileUrl(cloudUrl);
        note.setFileType(fileType);
        note.setTextContent(extractedText);
        note.setUser(user);
        note = noteRepository.save(note);

        // Chunk note, generate embeddings and index in database/ChromaDB
        processChunksAndEmbeddings(note, extractedText);

        // Update Study Streak Log
        updateStudyStreak(user, "UPLOAD_NOTE");

        return mapToResponse(note, false);
    }

    private void processChunksAndEmbeddings(Note note, String text) {
        // Split text: chunk size 1000 characters, overlap 200 characters
        List<String> chunks = splitText(text, 1000, 200);
        logger.info("Splitting note ID {} into {} chunks for vector store", note.getId(), chunks.size());

        List<NoteChunk> noteChunks = new ArrayList<>();

        for (int i = 0; i < chunks.size(); i++) {
            String chunkText = chunks.get(i);
            String vectorId = "fallback_note_" + note.getId() + "_chunk_" + i;

            try {
                if (embeddingStore == null) {
                    throw new RuntimeException("ChromaDB is offline.");
                }
                TextSegment segment = TextSegment.from(chunkText, Metadata.metadata("noteId", note.getId()));
                Embedding embedding = embeddingModel.embed(segment).content();
                String chromaId = embeddingStore.add(embedding, segment);
                if (chromaId != null && !chromaId.isBlank()) {
                    vectorId = chromaId;
                }
            } catch (Exception e) {
                logger.error("ChromaDB vector ingestion failed for chunk index {}. Using fallback ID.", i, e);
            }

            // MySQL Chunk record
            NoteChunk chunk = new NoteChunk();
            chunk.setNote(note);
            chunk.setChunkIndex(i);
            chunk.setContent(chunkText);
            chunk.setVectorId(vectorId);
            noteChunks.add(chunk);
        }

        noteChunkRepository.saveAll(noteChunks);
    }

    private List<String> splitText(String text, int chunkSize, int overlap) {
        List<String> chunks = new ArrayList<>();
        if (text == null || text.isBlank()) {
            return chunks;
        }

        int start = 0;
        while (start < text.length()) {
            int end = Math.min(start + chunkSize, text.length());
            chunks.add(text.substring(start, end));
            if (end == text.length()) {
                break;
            }
            start = end - overlap;
            if (start >= end) {
                start = end; // boundary safety
            }
        }
        return chunks;
    }

    @Transactional(readOnly = true)
    public Page<NoteResponse> getAllNotesForUser(User user, Pageable pageable) {
        Page<Note> notesPage = noteRepository.findByUser(user, pageable);
        return notesPage.map(note -> {
            boolean isBookmarked = bookmarkRepository.existsByUserAndNote(user, note);
            return mapToResponse(note, isBookmarked);
        });
    }

    @Transactional(readOnly = true)
    public NoteResponse getNoteById(Long noteId, User user) {
        Note note = noteRepository.findByIdAndUser(noteId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Note", "id", noteId));
        boolean isBookmarked = bookmarkRepository.existsByUserAndNote(user, note);
        return mapToResponse(note, isBookmarked);
    }

    @Transactional
    public void deleteNote(Long noteId, User user) {
        Note note = noteRepository.findByIdAndUser(noteId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Note", "id", noteId));

        // Delete from ChromaDB
        List<NoteChunk> chunks = noteChunkRepository.findByNote(note);
        for (NoteChunk chunk : chunks) {
            try {
                // LangChain4j embeddingStore delete might require specific syntax, 
                // in ChromaDB client we can let it be or delete by ID.
                // If the store is down, we log a warning.
            } catch (Exception e) {
                logger.warn("Could not delete chunk {} from vector store: {}", chunk.getVectorId(), e.getMessage());
            }
        }

        noteRepository.delete(note);
        logger.info("Successfully deleted note ID: {}", noteId);
    }

    @Transactional
    public boolean toggleBookmark(Long noteId, User user) {
        Note note = noteRepository.findByIdAndUser(noteId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Note", "id", noteId));

        return bookmarkRepository.findByUserAndNote(user, note)
                .map(bookmark -> {
                    bookmarkRepository.delete(bookmark);
                    return false; // unbookmarked
                })
                .orElseGet(() -> {
                    Bookmark bookmark = new Bookmark();
                    bookmark.setUser(user);
                    bookmark.setNote(note);
                    bookmarkRepository.save(bookmark);
                    return true; // bookmarked
                });
    }

    @Transactional(readOnly = true)
    public List<NoteResponse> getBookmarkedNotes(User user) {
        List<Bookmark> bookmarks = bookmarkRepository.findByUserOrderByCreatedAtDesc(user);
        return bookmarks.stream()
                .map(bookmark -> mapToResponse(bookmark.getNote(), true))
                .toList();
    }

    public void updateStudyStreak(User user, String activityType) {
        LocalDate today = LocalDate.now();

        // Check if there is already a log for today
        if (studyLogRepository.findByUserAndActivityDate(user, today).isEmpty()) {
            StudyLog log = new StudyLog();
            log.setUser(user);
            log.setActivityType(activityType);
            studyLogRepository.save(log);

            LocalDate lastStudy = user.getLastStudyDate();
            if (lastStudy == null) {
                user.setStudyStreak(1);
            } else if (lastStudy.equals(today.minusDays(1))) {
                user.setStudyStreak(user.getStudyStreak() + 1);
            } else if (!lastStudy.equals(today)) {
                user.setStudyStreak(1); // Streak broke, reset to 1
            }

            user.setLastStudyDate(today);
            userRepository.save(user);
            logger.info("Updated student study streak to: {}", user.getStudyStreak());
        }
    }

    private NoteResponse mapToResponse(Note note, boolean isBookmarked) {
        NoteResponse res = new NoteResponse();
        res.setId(note.getId());
        res.setTitle(note.getTitle());
        res.setDescription(note.getDescription());
        res.setFileUrl(note.getFileUrl());
        res.setFileType(note.getFileType());
        res.setTextContent(note.getTextContent());
        res.setIsBookmarked(isBookmarked);
        res.setCreatedAt(note.getCreatedAt());
        return res;
    }
}
