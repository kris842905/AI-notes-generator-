package com.students.notesgenerator.repository;

import com.students.notesgenerator.entity.Note;
import com.students.notesgenerator.entity.NoteChunk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NoteChunkRepository extends JpaRepository<NoteChunk, Long> {
    List<NoteChunk> findByNote(Note note);
    void deleteByNote(Note note);
}
