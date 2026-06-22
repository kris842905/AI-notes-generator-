package com.students.notesgenerator.repository;

import com.students.notesgenerator.entity.Note;
import com.students.notesgenerator.entity.Summary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SummaryRepository extends JpaRepository<Summary, Long> {
    Optional<Summary> findByNoteAndMode(Note note, String mode);
    List<Summary> findByNote(Note note);
}
