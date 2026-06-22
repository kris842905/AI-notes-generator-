package com.students.notesgenerator.repository;

import com.students.notesgenerator.entity.Note;
import com.students.notesgenerator.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NoteRepository extends JpaRepository<Note, Long> {
    List<Note> findByUserOrderByCreatedAtDesc(User user);
    Page<Note> findByUser(User user, Pageable pageable);
    Optional<Note> findByIdAndUser(Long id, User user);
}
