package com.students.notesgenerator.repository;

import com.students.notesgenerator.entity.QuizAttempt;
import com.students.notesgenerator.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {
    List<QuizAttempt> findByUserOrderByAttemptDateDesc(User user);
    List<QuizAttempt> findByUser(User user);
}
