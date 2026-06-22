package com.students.notesgenerator.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public class QuizSubmitRequest {

    @NotEmpty(message = "Answers cannot be empty")
    private List<AnswerSelection> answers;

    public QuizSubmitRequest() {}

    public List<AnswerSelection> getAnswers() {
        return answers;
    }

    public void setAnswers(List<AnswerSelection> answers) {
        this.answers = answers;
    }

    public static class AnswerSelection {
        @NotNull(message = "Question ID is required")
        private Long questionId;

        @NotBlank(message = "Selected option is required")
        private String selectedOption; // A, B, C, D

        public AnswerSelection() {}

        public Long getQuestionId() {
            return questionId;
        }

        public void setQuestionId(Long questionId) {
            this.questionId = questionId;
        }

        public String getSelectedOption() {
            return selectedOption;
        }

        public void setSelectedOption(String selectedOption) {
            this.selectedOption = selectedOption;
        }
    }
}
