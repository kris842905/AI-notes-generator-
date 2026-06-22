import React, { useState, useEffect, useRef } from 'react';
import PageContainer from '../components/layout/PageContainer';
import { Sparkles, FileText, CheckCircle2, XCircle, Clock, RotateCcw, ChevronLeft, ChevronRight, Award, History, BookOpen } from 'lucide-react';
import api from '../services/api';

const Quizzes = () => {
  const [notes, setNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState('');
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('quiz'); // 'quiz' or 'history'
  const [history, setHistory] = useState([]);

  // Quiz-taking state
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { questionId: 'A'|'B'|'C'|'D' }
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [result, setResult] = useState(null);

  const timerRef = useRef(null);

  useEffect(() => {
    fetchNotes();
    fetchHistory();
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await api.get('/notes?size=100');
      const noteList = res.data.content || [];
      setNotes(noteList);
      if (noteList.length > 0) {
        setSelectedNoteId(noteList[0].id);
      }
    } catch (err) {
      console.error('Failed to load notes', err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get('/quizzes/attempts');
      setHistory(res.data || []);
    } catch (err) {
      console.error('Failed to load quiz history', err);
    }
  };

  const fetchQuiz = async (noteId) => {
    if (!noteId) return;
    setLoading(true);
    setQuiz(null);
    setResult(null);
    setQuizCompleted(false);
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    clearInterval(timerRef.current);

    try {
      const res = await api.get(`/quizzes?noteId=${noteId}`);
      setQuiz(res.data);
      if (res.data && res.data.timeLimit) {
        setTimeLeft(res.data.timeLimit * 60);
      }
    } catch (err) {
      console.error('Failed to generate quiz', err);
      alert('AI Quiz generation failed. Make sure your Gemini API key is configured correctly.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedNoteId && activeTab === 'quiz') {
      fetchQuiz(selectedNoteId);
    }
  }, [selectedNoteId, activeTab]);

  // Timer countdown hook
  useEffect(() => {
    if (timeLeft > 0 && !quizCompleted && quiz) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleSubmitQuiz(true); // Auto submit on timeout
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [timeLeft, quizCompleted, quiz]);

  const handleSelectOption = (questionId, option) => {
    if (quizCompleted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: option
    }));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSubmitQuiz = async (isTimeout = false) => {
    if (!quiz || submitting) return;
    setSubmitting(true);
    clearInterval(timerRef.current);

    // Format selection array: [ { questionId: 1, selectedOption: 'A' } ]
    const answersList = quiz.questions.map((q) => ({
      questionId: q.id,
      selectedOption: selectedAnswers[q.id] || 'A' // default to option A if unselected
    }));

    try {
      const res = await api.post(`/quizzes/${quiz.id}/submit`, {
        answers: answersList
      });
      setResult(res.data);
      setQuizCompleted(true);
      fetchHistory(); // Refresh history log
      if (isTimeout) {
        alert("Time is up! Your quiz has been auto-submitted.");
      }
    } catch (err) {
      console.error('Quiz submission failed', err);
      alert('Failed to submit quiz results.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    if (selectedNoteId) {
      fetchQuiz(selectedNoteId);
    }
  };

  return (
    <PageContainer title="AI Quiz Center" subtitle="Generate dynamic multiple-choice assessments from documents and test your knowledge.">
      
      {/* Navigation Tabs */}
      <div className="flex border-b border-border mb-6">
        <button
          onClick={() => setActiveTab('quiz')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-sm transition-all ${
            activeTab === 'quiz' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <BookOpen size={16} /> Take Quiz
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-sm transition-all ${
            activeTab === 'history' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <History size={16} /> Attempt History
        </button>
      </div>

      {activeTab === 'quiz' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Config sidebar card */}
          <div className="glass rounded-3xl p-6 border border-border/60 flex flex-col gap-5 h-fit">
            <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
              <Sparkles size={18} className="text-primary" /> Setup
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase pl-1">Select Study Material</label>
              {notes.length === 0 ? (
                <p className="text-xs text-muted-foreground bg-secondary/30 p-3 rounded-2xl border">
                  No notes available. Please upload a file first.
                </p>
              ) : (
                <select
                  value={selectedNoteId}
                  onChange={(e) => setSelectedNoteId(e.target.value)}
                  disabled={quiz && !quizCompleted && timeLeft > 0}
                  className="w-full px-4 py-2.5 bg-secondary/50 border border-border focus:border-primary rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {notes.map(note => (
                    <option key={note.id} value={note.id}>{note.title}</option>
                  ))}
                </select>
              )}
            </div>

            {quiz && !quizCompleted && (
              <div className="mt-4 p-4 bg-primary/5 rounded-2xl border border-primary/25 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Time Remaining</span>
                  <div className="flex items-center gap-1.5 text-sm font-bold text-primary animate-pulse">
                    <Clock size={16} />
                    {formatTime(timeLeft)}
                  </div>
                </div>
                <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-primary h-full transition-all duration-1000"
                    style={{ width: `${(timeLeft / (quiz.timeLimit * 60)) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {quizCompleted && (
              <button
                onClick={handleReset}
                className="w-full py-3 bg-secondary hover:bg-muted border rounded-2xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw size={16} /> Retake Quiz
              </button>
            )}
          </div>

          {/* Main workspace area */}
          <div className="lg:col-span-2 flex flex-col min-h-96">
            
            {loading ? (
              <div className="glass rounded-3xl border border-border/60 p-20 flex-grow flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="text-xs text-muted-foreground animate-pulse">Gemini is synthesizing context-aware MCQs...</p>
              </div>
            ) : !quiz ? (
              <div className="glass rounded-3xl border border-border/60 p-20 flex-grow flex flex-col items-center justify-center text-center text-muted-foreground gap-3">
                <Award size={48} className="stroke-1 text-primary" />
                <div>
                  <p className="font-bold text-base text-foreground">No Active Assessment</p>
                  <p className="text-xs text-muted-foreground">Select a note from the setup panel to initialize a customized MCQ quiz.</p>
                </div>
              </div>
            ) : !quizCompleted ? (
              // Quiz Taking Card
              <div className="glass rounded-3xl p-6 border border-border/60 flex flex-col justify-between flex-grow gap-6 bg-gradient-to-br from-card to-background">
                
                {/* Header info */}
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h3 className="font-bold text-base text-foreground">{quiz.title || "Study Quiz"}</h3>
                    <p className="text-xs text-muted-foreground">Answer all questions to finalize evaluations.</p>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 bg-secondary rounded-xl">
                    Question {currentQuestionIndex + 1} of {quiz.questions.length}
                  </span>
                </div>

                {/* Progress bubbles */}
                <div className="flex flex-wrap gap-1.5 justify-center py-2">
                  {quiz.questions.map((q, idx) => (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={`w-7 h-7 rounded-full text-xs font-bold transition-all border ${
                        currentQuestionIndex === idx
                          ? 'bg-primary text-white border-primary scale-110'
                          : selectedAnswers[q.id]
                          ? 'bg-primary/10 border-primary/20 text-primary'
                          : 'bg-secondary/40 border-border text-muted-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>

                {/* Question view */}
                {quiz.questions.map((q, idx) => {
                  if (idx !== currentQuestionIndex) return null;
                  const options = [
                    { key: 'A', value: q.optionA },
                    { key: 'B', value: q.optionB },
                    { key: 'C', value: q.optionC },
                    { key: 'D', value: q.optionD }
                  ].filter(o => o.value);

                  return (
                    <div key={q.id} className="space-y-6 flex-grow flex flex-col justify-center animate-fade-in">
                      <p className="text-base md:text-lg font-bold text-foreground leading-relaxed">
                        {idx + 1}. {q.question}
                      </p>

                      <div className="grid grid-cols-1 gap-3">
                        {options.map((opt) => {
                          const isSelected = selectedAnswers[q.id] === opt.key;
                          return (
                            <button
                              key={opt.key}
                              onClick={() => handleSelectOption(q.id, opt.key)}
                              className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-3 ${
                                isSelected 
                                  ? 'bg-primary/5 border-primary text-foreground ring-1 ring-primary' 
                                  : 'bg-background hover:bg-secondary/40 border-border text-foreground/80'
                              }`}
                            >
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${
                                isSelected 
                                  ? 'bg-primary text-white border-primary' 
                                  : 'bg-secondary border-border text-muted-foreground'
                              }`}>
                                {opt.key}
                              </span>
                              <span className="text-sm font-medium">{opt.value}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Bottom navigation */}
                <div className="flex items-center justify-between border-t pt-4">
                  <button
                    onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentQuestionIndex === 0}
                    className="px-4 py-2 border rounded-xl hover:bg-secondary/40 transition-all text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40"
                  >
                    <ChevronLeft size={14} /> Back
                  </button>

                  {currentQuestionIndex === quiz.questions.length - 1 ? (
                    <button
                      onClick={() => handleSubmitQuiz(false)}
                      disabled={submitting}
                      className="px-6 py-2 bg-primary text-white hover:bg-primary/95 rounded-xl text-xs font-bold transition-all shadow-md shadow-primary/10 disabled:opacity-50"
                    >
                      {submitting ? 'Submitting Responses...' : 'Finish & Submit'}
                    </button>
                  ) : (
                    <button
                      onClick={() => setCurrentQuestionIndex(prev => Math.min(quiz.questions.length - 1, prev + 1))}
                      className="px-4 py-2 bg-secondary hover:bg-muted border rounded-xl transition-all text-xs font-semibold flex items-center gap-1.5"
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  )}
                </div>

              </div>
            ) : (
              // Quiz Results View
              <div className="space-y-6 animate-fade-in">
                
                {/* Result Hero Header */}
                <div className="glass rounded-3xl p-6 border border-border/60 text-center flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-primary/10 to-transparent">
                  <Award size={64} className="text-primary stroke-1" />
                  <div>
                    <h3 className="font-bold text-xl text-foreground">Assessment Complete!</h3>
                    <p className="text-xs text-muted-foreground mt-1">Here is a detailed breakdown of your performance.</p>
                  </div>

                  <div className="flex items-center gap-6 mt-2">
                    <div className="text-center">
                      <p className="text-3xl font-black text-foreground">{result.score} / {result.totalQuestions}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1">Score</p>
                    </div>
                    <div className="w-px h-12 bg-border" />
                    <div className="text-center">
                      <p className="text-3xl font-black text-primary">{Math.round(result.percentage)}%</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1">Accuracy</p>
                    </div>
                  </div>
                </div>

                {/* Question Review List */}
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-foreground uppercase tracking-wider pl-1">Review Questions</h4>
                  {result.questions.map((q, idx) => {
                    const options = [
                      { key: 'A', value: q.optionA },
                      { key: 'B', value: q.optionB },
                      { key: 'C', value: q.optionC },
                      { key: 'D', value: q.optionD }
                    ].filter(o => o.value);

                    return (
                      <div key={q.questionId} className="glass rounded-3xl p-5 border border-border/60 space-y-4 bg-gradient-to-br from-card to-background">
                        
                        {/* Question title & correctness */}
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-sm font-bold text-foreground leading-relaxed">
                            {idx + 1}. {q.question}
                          </p>
                          {q.isCorrect ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                              <CheckCircle2 size={12} /> Correct
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                              <XCircle size={12} /> Incorrect
                            </span>
                          )}
                        </div>

                        {/* Options */}
                        <div className="grid grid-cols-1 gap-2 pl-2">
                          {options.map(opt => {
                            const isSelected = q.studentAnswer === opt.key;
                            const isCorrect = q.correctAnswer === opt.key;

                            let optStyle = 'border-border bg-secondary/20 text-foreground/80';
                            if (isCorrect) {
                              optStyle = 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold ring-1 ring-emerald-500/30';
                            } else if (isSelected && !isCorrect) {
                              optStyle = 'border-rose-500/50 bg-rose-500/10 text-rose-700 dark:text-rose-400 font-semibold ring-1 ring-rose-500/30';
                            }

                            return (
                              <div key={opt.key} className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 ${optStyle}`}>
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                                  isCorrect 
                                    ? 'bg-emerald-500 text-white border-emerald-500' 
                                    : isSelected 
                                    ? 'bg-rose-500 text-white border-rose-500' 
                                    : 'bg-secondary border-border'
                                }`}>
                                  {opt.key}
                                </span>
                                <span>{opt.value}</span>
                              </div>
                            );
                          })}
                        </div>

                        {/* AI Explanation Accordion */}
                        <div className="p-3 bg-primary/5 rounded-2xl border border-primary/20 mt-2">
                          <p className="text-[10px] font-bold uppercase text-primary tracking-wider mb-1">AI Explanation</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">{q.explanation}</p>
                        </div>

                      </div>
                    );
                  })}
                </div>

              </div>
            )}
          </div>

        </div>
      )}

      {activeTab === 'history' && (
        <div className="glass rounded-3xl border border-border/60 overflow-hidden bg-gradient-to-br from-card to-background animate-fade-in">
          
          <div className="p-5 border-b flex justify-between items-center">
            <div>
              <h3 className="font-bold text-base text-foreground font-display">Attempt History</h3>
              <p className="text-xs text-muted-foreground">Review your past scores and test records.</p>
            </div>
          </div>

          {history.length === 0 ? (
            <div className="p-20 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
              <Award size={36} className="stroke-1 text-primary" />
              <p className="text-sm font-semibold text-foreground">No Attempts Recorded</p>
              <p className="text-xs">Take your first quiz to begin tracking analytics.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-secondary/40 text-muted-foreground text-xs uppercase font-bold tracking-wider border-b">
                    <th className="p-4 pl-6">Material Title</th>
                    <th className="p-4">Completed On</th>
                    <th className="p-4 text-center">Score</th>
                    <th className="p-4 text-center">Percentage</th>
                    <th className="p-4 pr-6">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((attempt) => {
                    const noteTitle = attempt.noteTitle || (notes.find(n => n.id === attempt.noteId)?.title) || `Study Material #${attempt.noteId}`;
                    const passed = attempt.percentage >= 60;
                    return (
                      <tr key={attempt.id} className="border-b hover:bg-secondary/20 transition-all">
                        <td className="p-4 pl-6 font-semibold text-foreground">{noteTitle}</td>
                        <td className="p-4 text-xs text-muted-foreground">
                          {new Date(attempt.completedAt).toLocaleString()}
                        </td>
                        <td className="p-4 text-center font-bold">{attempt.score} / {attempt.totalQuestions}</td>
                        <td className="p-4 text-center text-primary font-bold">{Math.round(attempt.percentage)}%</td>
                        <td className="p-4 pr-6">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                            passed ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                          }`}>
                            {passed ? 'Passed' : 'Needs Review'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </PageContainer>
  );
};

export default Quizzes;
