package com.students.notesgenerator.repository;

import com.students.notesgenerator.entity.Notification;
import com.students.notesgenerator.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserOrderByCreatedAtDesc(User user);
    Long countByUserAndIsReadFalse(User user);
}
