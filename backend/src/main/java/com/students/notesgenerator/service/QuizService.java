package com.students.notesgenerator.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.students.notesgenerator.dto.request.QuizSubmitRequest;
import com.students.notesgenerator.dto.response.QuizResponse;
import com.students.notesgenerator.dto.response.QuizResultResponse;
import com.students.notesgenerator.entity.*;
import com.students.notesgenerator.exception.AIProcessingException;
import com.students.notesgenerator.exception.ResourceNotFoundException;
import com.students.notesgenerator.repository.NoteRepository;
import com.students.notesgenerator.repository.QuizAttemptRepository;
import com.students.notesgenerator.repository.QuizRepository;
import dev.langchain4j.model.googleai.GoogleAiGeminiChatModel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class QuizService {

    private static final Logger logger = LoggerFactory.getLogger(QuizService.class);

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private QuizAttemptRepository quizAttemptRepository;

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private GoogleAiGeminiChatModel chatModel;

    @Autowired
    private NoteService noteService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public QuizResponse getOrGenerateQuiz(Long noteId, User user) {
        Note note = noteRepository.findByIdAndUser(noteId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Note", "id", noteId));

        List<Quiz> existingQuizzes = quizRepository.findByNote(note);
        if (!existingQuizzes.isEmpty()) {
            return mapToResponse(existingQuizzes.get(0));
        }

        return generateNewQuiz(note, user);
    }

    private QuizResponse generateNewQuiz(Note note, User user) {
        logger.info("Generating new Quiz for Note ID: {}", note.getId());

        String prompt = """
                Generate a list of 5 multiple-choice quiz questions based on the text below.
                
                You must return ONLY a JSON array containing the quiz questions. Do not add any markdown wrapper like ```json or ```. Output raw valid JSON only.
                Each JSON object in the array must strictly have the following fields:
                - question (String)
                - optionA (String)
                - optionB (String)
                - optionC (String)
                - optionD (String)
                - correctAnswer (String: must be one of 'A', 'B', 'C', 'D')
                - explanation (String)
                
                Text Content:
                %s
                """;

        String formattedPrompt = String.format(prompt, note.getTextContent());
        String aiResponse;
        try {
            aiResponse = chatModel.generate(formattedPrompt);
        } catch (Exception e) {
            logger.error("Failed to generate Quiz with Gemini", e);
            throw new AIProcessingException("Failed to generate Quiz: " + e.getMessage(), e);
        }

        aiResponse = cleanJsonResponse(aiResponse);

        try {
            List<Map<String, String>> rawQuestions = objectMapper.readValue(aiResponse, new TypeReference<>() {});
            
            Quiz quiz = new Quiz();
            quiz.setNote(note);
            quiz.setTitle("Quiz: " + note.getTitle());
            quiz.setTimeLimit(600); // 10 minutes default

            List<QuizQuestion> questions = new ArrayList<>();
            for (Map<String, String> item : rawQuestions) {
                QuizQuestion qq = new QuizQuestion();
                qq.setQuiz(quiz);
                qq.setQuestion(item.get("question"));
                qq.setOptionA(item.get("optionA"));
                qq.setOptionB(item.get("optionB"));
                qq.setOptionC(item.get("optionC"));
                qq.setOptionD(item.get("optionD"));
                qq.setCorrectAnswer(item.get("correctAnswer").toUpperCase());
                qq.setExplanation(item.get("explanation"));
                questions.add(qq);
            }
            quiz.setQuestions(questions);

            Quiz saved = quizRepository.save(quiz);

            // Update streak activity
            noteService.updateStudyStreak(user, "GENERATE_QUIZ");

            return mapToResponse(saved);
        } catch (Exception e) {
            logger.error("Failed to parse Quiz JSON: " + aiResponse, e);
            throw new AIProcessingException("Failed to process Quiz response: " + e.getMessage(), e);
        }
    }

    @Transactional
    public QuizResultResponse submitQuiz(Long quizId, QuizSubmitRequest request, User user) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz", "id", quizId));

        List<QuizQuestion> questions = quiz.getQuestions();
        Map<Long, String> submissionMap = request.getAnswers().stream()
                .collect(Collectors.toMap(
                        QuizSubmitRequest.AnswerSelection::getQuestionId,
                        ans -> ans.getSelectedOption().toUpperCase()
                ));

        int score = 0;
        List<QuizResultResponse.QuestionResultDto> resultDetails = new ArrayList<>();

        for (QuizQuestion qq : questions) {
            String studentAns = submissionMap.getOrDefault(qq.getId(), "");
            boolean isCorrect = qq.getCorrectAnswer().equals(studentAns);
            if (isCorrect) {
                score++;
            }

            QuizResultResponse.QuestionResultDto dto = new QuizResultResponse.QuestionResultDto();
            dto.setQuestionId(qq.getId());
            dto.setQuestion(qq.getQuestion());
            dto.setOptionA(qq.getOptionA());
            dto.setOptionB(qq.getOptionB());
            dto.setOptionC(qq.getOptionC());
            dto.setOptionD(qq.getOptionD());
            dto.setStudentAnswer(studentAns);
            dto.setCorrectAnswer(qq.getCorrectAnswer());
            dto.setExplanation(qq.getExplanation());
            dto.setIsCorrect(isCorrect);
            resultDetails.add(dto);
        }

        // Save Attempt
        QuizAttempt attempt = new QuizAttempt();
        attempt.setUser(user);
        attempt.setQuiz(quiz);
        attempt.setScore(score);
        attempt.setTotalQuestions(questions.size());
        attempt = quizAttemptRepository.save(attempt);

        // Update streak activity
        noteService.updateStudyStreak(user, "ATTEMPT_QUIZ");

        // Prepare Result Response
        QuizResultResponse res = new QuizResultResponse();
        res.setAttemptId(attempt.getId());
        res.setScore(score);
        res.setTotalQuestions(questions.size());
        res.setPercentage(((double) score / questions.size()) * 100);
        res.setQuestions(resultDetails);

        return res;
    }

    @Transactional(readOnly = true)
    public List<QuizAttempt> getAttemptHistory(User user) {
        return quizAttemptRepository.findByUserOrderByAttemptDateDesc(user);
    }

    private String cleanJsonResponse(String response) {
        String clean = response.trim();
        if (clean.startsWith("```json")) {
            clean = clean.substring(7);
        } else if (clean.startsWith("```")) {
            clean = clean.substring(3);
        }
        if (clean.endsWith("```")) {
            clean = clean.substring(0, clean.length() - 3);
        }
        return clean.trim();
    }

    private QuizResponse mapToResponse(Quiz quiz) {
        QuizResponse res = new QuizResponse();
        res.setId(quiz.getId());
        res.setNoteId(quiz.getNote().getId());
        res.setTitle(quiz.getTitle());
        res.setTimeLimit(quiz.getTimeLimit());

        List<QuizResponse.QuizQuestionResponse> qList = quiz.getQuestions().stream()
                .map(qq -> {
                    QuizResponse.QuizQuestionResponse qRes = new QuizResponse.QuizQuestionResponse();
                    qRes.setId(qq.getId());
                    qRes.setQuestion(qq.getQuestion());
                    qRes.setOptionA(qq.getOptionA());
                    qRes.setOptionB(qq.getOptionB());
                    qRes.setOptionC(qq.getOptionC());
                    qRes.setOptionD(qq.getOptionD());
                    return qRes;
                })
                .toList();

        res.setQuestions(qList);
        return res;
    }
}
