package com.students.notesgenerator.dto.response;

import java.time.LocalDate;
import java.util.List;

public class AnalyticsResponse {
    private Long totalNotes;
    private Double averageAccuracy;
    private Integer studyStreak;
    private Long totalQuizzesAttempted;
    private List<ActivityLogDto> studyActivity;

    public AnalyticsResponse() {}

    public Long getTotalNotes() {
        return totalNotes;
    }

    public void setTotalNotes(Long totalNotes) {
        this.totalNotes = totalNotes;
    }

    public Double getAverageAccuracy() {
        return averageAccuracy;
    }

    public void setAverageAccuracy(Double averageAccuracy) {
        this.averageAccuracy = averageAccuracy;
    }

    public Integer getStudyStreak() {
        return studyStreak;
    }

    public void setStudyStreak(Integer studyStreak) {
        this.studyStreak = studyStreak;
    }

    public Long getTotalQuizzesAttempted() {
        return totalQuizzesAttempted;
    }

    public void setTotalQuizzesAttempted(Long totalQuizzesAttempted) {
        this.totalQuizzesAttempted = totalQuizzesAttempted;
    }

    public List<ActivityLogDto> getStudyActivity() {
        return studyActivity;
    }

    public void setStudyActivity(List<ActivityLogDto> studyActivity) {
        this.studyActivity = studyActivity;
    }

    public static class ActivityLogDto {
        private LocalDate date;
        private String activityType;

        public ActivityLogDto() {}

        public LocalDate getDate() {
            return date;
        }

        public void setDate(LocalDate date) {
            this.date = date;
        }

        public String getActivityType() {
            return activityType;
        }

        public void setActivityType(String activityType) {
            this.activityType = activityType;
        }
    }
}
