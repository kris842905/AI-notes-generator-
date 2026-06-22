package com.students.notesgenerator.repository;

import com.students.notesgenerator.entity.MCQ;
import com.students.notesgenerator.entity.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MCQRepository extends JpaRepository<MCQ, Long> {
    List<MCQ> findByNote(Note note);
    List<MCQ> findByNoteAndDifficulty(Note note, String difficulty);
}
