package com.students.notesgenerator.repository;

import com.students.notesgenerator.entity.Flashcard;
import com.students.notesgenerator.entity.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FlashcardRepository extends JpaRepository<Flashcard, Long> {
    List<Flashcard> findByNote(Note note);
}
