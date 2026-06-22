package com.students.notesgenerator.repository;

import com.students.notesgenerator.entity.StudyLog;
import com.students.notesgenerator.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface StudyLogRepository extends JpaRepository<StudyLog, Long> {
    List<StudyLog> findByUser(User user);
    Optional<StudyLog> findByUserAndActivityDate(User user, LocalDate activityDate);
}
