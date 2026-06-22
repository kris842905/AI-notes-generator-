package com.students.notesgenerator.repository;

import com.students.notesgenerator.entity.Bookmark;
import com.students.notesgenerator.entity.Note;
import com.students.notesgenerator.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookmarkRepository extends JpaRepository<Bookmark, Long> {
    List<Bookmark> findByUserOrderByCreatedAtDesc(User user);
    Optional<Bookmark> findByUserAndNote(User user, Note note);
    Boolean existsByUserAndNote(User user, Note note);
}
