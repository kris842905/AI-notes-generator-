import React, { useState, useEffect } from 'react';
import PageContainer from '../components/layout/PageContainer';
import { Sparkles, FileText, ChevronLeft, ChevronRight, RotateCw, Check, Star, List, Layers } from 'lucide-react';
import api from '../services/api';

const Flashcards = () => {
  const [notes, setNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState('');
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'list'
  const [starredIds, setStarredIds] = useState(new Set());
  const [masteredIds, setMasteredIds] = useState(new Set());

  useEffect(() => {
    fetchNotes();
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

  const fetchFlashcards = async (noteId) => {
    if (!noteId) return;
    setLoading(true);
    setFlashcards([]);
    setCurrentIndex(0);
    setIsFlipped(false);
    try {
      const res = await api.get(`/flashcards?noteId=${noteId}`);
      setFlashcards(res.data || []);
    } catch (err) {
      console.error('Failed to load flashcards', err);
      alert('AI Flashcard generation failed. Please verify that your Gemini API key is configured correctly.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedNoteId) {
      fetchFlashcards(selectedNoteId);
    }
  }, [selectedNoteId]);

  const handleNext = () => {
    if (flashcards.length === 0) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % flashcards.length);
    }, 150);
  };

  const handlePrev = () => {
    if (flashcards.length === 0) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    }, 150);
  };

  const toggleStar = (id, e) => {
    e.stopPropagation();
    setStarredIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleMastered = (id, e) => {
    e.stopPropagation();
    setMasteredIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const currentCard = flashcards[currentIndex];
  const progressPercent = flashcards.length > 0 ? ((currentIndex + 1) / flashcards.length) * 100 : 0;
  const masteredCount = flashcards.filter(c => masteredIds.has(c.id)).length;

  return (
    <PageContainer title="AI Flashcard Tutor" subtitle="Master core concepts using active recall flashcards generated automatically from your study notes.">
      <div className="flex flex-col gap-6">
        
        {/* Top bar control panel */}
        <div className="glass rounded-3xl p-5 border border-border/60 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <span className="text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap pl-1">Study Material:</span>
            {notes.length === 0 ? (
              <p className="text-xs text-muted-foreground bg-secondary/30 px-4 py-2 rounded-2xl border">
                Please upload a note first to generate flashcards.
              </p>
            ) : (
              <select
                value={selectedNoteId}
                onChange={(e) => setSelectedNoteId(e.target.value)}
                className="w-full md:w-64 px-4 py-2 bg-secondary/50 border border-border focus:border-primary rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
              >
                {notes.map(note => (
                  <option key={note.id} value={note.id}>{note.title}</option>
                ))}
              </select>
            )}
          </div>

          {flashcards.length > 0 && (
            <div className="flex items-center gap-2 bg-secondary/30 p-1.5 rounded-2xl border">
              <button
                onClick={() => setViewMode('card')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  viewMode === 'card' 
                    ? 'bg-background text-foreground shadow' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Layers size={14} /> Flashcards
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  viewMode === 'list' 
                    ? 'bg-background text-foreground shadow' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <List size={14} /> List View
              </button>
            </div>
          )}
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="glass rounded-3xl border border-border/60 p-20 flex flex-col items-center justify-center gap-3 min-h-96">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-xs text-muted-foreground animate-pulse">Gemini is parsing and generating active recall flashcards...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && flashcards.length === 0 && selectedNoteId && (
          <div className="glass rounded-3xl border border-border/60 p-20 flex flex-col items-center justify-center text-center gap-3 min-h-96 text-muted-foreground">
            <Layers size={48} className="stroke-1 text-primary" />
            <div>
              <p className="font-bold text-base text-foreground">No Flashcards Available</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">Upload a new document or verify note contents to generate AI review questions.</p>
            </div>
          </div>
        )}

        {/* 3D Card deck mode */}
        {!loading && flashcards.length > 0 && viewMode === 'card' && (
          <div className="flex flex-col items-center gap-6 max-w-2xl mx-auto w-full">
            
            {/* Stats header */}
            <div className="flex justify-between w-full text-xs text-muted-foreground px-2">
              <span>Progress: {currentIndex + 1} / {flashcards.length} cards</span>
              <span>Mastered: {masteredCount} / {flashcards.length} ({Math.round((masteredCount / flashcards.length) * 100)}%)</span>
            </div>

            {/* Progress line */}
            <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden border">
              <div 
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* The 3D Card Flipping Container */}
            <div 
              onClick={() => setIsFlipped(!isFlipped)}
              className="w-full aspect-[1.6/1] relative cursor-pointer [perspective:1000px]"
            >
              <div 
                className={`relative w-full h-full duration-500 [transform-style:preserve-3d] ${
                  isFlipped ? '[transform:rotateY(180deg)]' : ''
                }`}
              >
                
                {/* CARD FRONT (Question) */}
                <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] glass rounded-[2rem] p-8 border border-border/60 flex flex-col justify-between shadow-xl bg-gradient-to-br from-card to-background">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                      Question
                    </span>
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => toggleStar(currentCard.id, e)}
                        className={`p-1.5 rounded-xl border transition-all hover:bg-secondary/80 ${
                          starredIds.has(currentCard.id) ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'text-muted-foreground bg-secondary/30'
                        }`}
                      >
                        <Star size={14} fill={starredIds.has(currentCard.id) ? "currentColor" : "none"} />
                      </button>
                      <button 
                        onClick={(e) => toggleMastered(currentCard.id, e)}
                        className={`p-1.5 rounded-xl border transition-all hover:bg-secondary/80 ${
                          masteredIds.has(currentCard.id) ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'text-muted-foreground bg-secondary/30'
                        }`}
                      >
                        <Check size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="flex-grow flex items-center justify-center text-center px-4">
                    <p className="text-lg md:text-xl font-bold leading-relaxed text-foreground select-none">
                      {currentCard.question}
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                    <RotateCw size={12} /> Click Card to reveal Answer
                  </div>
                </div>

                {/* CARD BACK (Answer) */}
                <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-gradient-to-br from-primary to-primary-dark text-white rounded-[2rem] p-8 flex flex-col justify-between shadow-xl">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 text-white">
                      Answer
                    </span>
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => toggleStar(currentCard.id, e)}
                        className={`p-1.5 rounded-xl border transition-all bg-white/10 hover:bg-white/20 border-white/20 ${
                          starredIds.has(currentCard.id) ? 'text-amber-300' : 'text-white/70'
                        }`}
                      >
                        <Star size={14} fill={starredIds.has(currentCard.id) ? "currentColor" : "none"} />
                      </button>
                      <button 
                        onClick={(e) => toggleMastered(currentCard.id, e)}
                        className={`p-1.5 rounded-xl border transition-all border-white/20 ${
                          masteredIds.has(currentCard.id) ? 'bg-emerald-500 border-emerald-500 text-white shadow-md' : 'bg-white/10 hover:bg-white/20 text-white/70'
                        }`}
                      >
                        <Check size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="flex-grow flex items-center justify-center text-center px-4 overflow-y-auto scroll-thin select-none">
                    <p className="text-base md:text-lg font-medium leading-relaxed max-h-[160px] whitespace-pre-wrap pr-1">
                      {currentCard.answer}
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-1.5 text-xs text-white/75">
                    <RotateCw size={12} /> Click Card to return to Question
                  </div>
                </div>

              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center gap-5 mt-2">
              <button
                onClick={handlePrev}
                className="p-3 bg-secondary hover:bg-muted border text-foreground rounded-2xl transition-all shadow-sm hover:scale-105"
                title="Previous card"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => setIsFlipped(!isFlipped)}
                className="px-6 py-3 bg-primary/10 hover:bg-primary/15 text-primary rounded-2xl text-sm font-bold border border-primary/20 transition-all flex items-center gap-2 hover:scale-102"
              >
                <RotateCw size={16} /> Flip Card
              </button>
              <button
                onClick={handleNext}
                className="p-3 bg-secondary hover:bg-muted border text-foreground rounded-2xl transition-all shadow-sm hover:scale-105"
                title="Next card"
              >
                <ChevronRight size={20} />
              </button>
            </div>

          </div>
        )}

        {/* List view mode */}
        {!loading && flashcards.length > 0 && viewMode === 'list' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
            {flashcards.map((card, idx) => (
              <div 
                key={card.id} 
                className="glass border border-border/60 rounded-3xl p-5 flex flex-col justify-between gap-4 bg-gradient-to-br from-card to-background relative overflow-hidden"
              >
                {/* Index & Star action */}
                <div className="flex items-center justify-between border-b pb-2 border-border/40">
                  <span className="text-xs font-semibold text-muted-foreground">Card {idx + 1}</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => toggleStar(card.id, e)}
                      className={`p-1.5 rounded-xl border transition-all ${
                        starredIds.has(card.id) ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'text-muted-foreground bg-secondary/30 hover:bg-secondary/60'
                      }`}
                    >
                      <Star size={12} fill={starredIds.has(card.id) ? "currentColor" : "none"} />
                    </button>
                    <button 
                      onClick={(e) => toggleMastered(card.id, e)}
                      className={`p-1.5 rounded-xl border transition-all ${
                        masteredIds.has(card.id) ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-500' : 'text-muted-foreground bg-secondary/30 hover:bg-secondary/60'
                      }`}
                    >
                      <Check size={12} />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <div>
                    <h4 className="text-[10px] uppercase font-bold tracking-wider text-primary">Question</h4>
                    <p className="text-sm font-bold text-foreground mt-0.5">{card.question}</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Answer</h4>
                    <p className="text-xs text-foreground/80 mt-0.5 whitespace-pre-wrap">{card.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </PageContainer>
  );
};

export default Flashcards;
