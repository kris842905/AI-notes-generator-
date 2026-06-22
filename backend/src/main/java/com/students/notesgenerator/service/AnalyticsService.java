package com.students.notesgenerator.service;

import com.students.notesgenerator.dto.response.AnalyticsResponse;
import com.students.notesgenerator.entity.Note;
import com.students.notesgenerator.entity.QuizAttempt;
import com.students.notesgenerator.entity.StudyLog;
import com.students.notesgenerator.entity.User;
import com.students.notesgenerator.repository.NoteRepository;
import com.students.notesgenerator.repository.QuizAttemptRepository;
import com.students.notesgenerator.repository.StudyLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AnalyticsService {

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private QuizAttemptRepository quizAttemptRepository;

    @Autowired
    private StudyLogRepository studyLogRepository;

    @Transactional(readOnly = true)
    public AnalyticsResponse getUserAnalytics(User user) {
        // 1. Total Notes uploaded
        List<Note> notes = noteRepository.findByUserOrderByCreatedAtDesc(user);
        long totalNotes = notes.size();

        // 2. Quiz attempts and accuracy calculations
        List<QuizAttempt> attempts = quizAttemptRepository.findByUser(user);
        long totalAttempts = attempts.size();
        double averageAccuracy = 0.0;

        if (totalAttempts > 0) {
            long totalCorrect = attempts.stream().mapToLong(QuizAttempt::getScore).sum();
            long totalQuestions = attempts.stream().mapToLong(QuizAttempt::getTotalQuestions).sum();
            if (totalQuestions > 0) {
                averageAccuracy = ((double) totalCorrect / totalQuestions) * 100;
            }
        }

        // 3. Current Streak
        int studyStreak = user.getStudyStreak() != null ? user.getStudyStreak() : 0;

        // 4. Historical study logs
        List<StudyLog> logs = studyLogRepository.findByUser(user);
        List<AnalyticsResponse.ActivityLogDto> activityList = logs.stream()
                .map(log -> {
                    AnalyticsResponse.ActivityLogDto dto = new AnalyticsResponse.ActivityLogDto();
                    dto.setDate(log.getActivityDate());
                    dto.setActivityType(log.getActivityType());
                    return dto;
                })
                .toList();

        // 5. Build response
        AnalyticsResponse response = new AnalyticsResponse();
        response.setTotalNotes(totalNotes);
        response.setAverageAccuracy(averageAccuracy);
        response.setStudyStreak(studyStreak);
        response.setTotalQuizzesAttempted(totalAttempts);
        response.setStudyActivity(activityList);

        return response;
    }
}
