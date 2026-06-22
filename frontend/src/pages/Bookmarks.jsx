import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import { Star, FileText, ChevronRight, MessageSquare, Layers, Award, Trash2 } from 'lucide-react';
import api from '../services/api';

const Bookmarks = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notes/bookmarks');
      setBookmarks(res.data || []);
    } catch (err) {
      console.error('Failed to load bookmarks', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBookmark = async (id, e) => {
    e.stopPropagation();
    try {
      await api.post(`/notes/${id}/bookmark`);
      setBookmarks((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error('Failed to update bookmark', err);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <PageContainer title="Bookmarked Notes" subtitle="Quickly access your starred study materials and jump straight into study modules.">
      
      {loading ? (
        <div className="glass rounded-3xl border border-border/60 p-20 flex flex-col items-center justify-center gap-3 min-h-96 animate-pulse">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground">Retrieving bookmarked materials...</p>
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="glass rounded-3xl border border-border/60 p-20 flex flex-col items-center justify-center text-center text-muted-foreground gap-3 min-h-96">
          <Star size={48} className="stroke-1 text-amber-500 animate-pulse" />
          <div>
            <p className="font-bold text-base text-foreground">No Bookmarks Saved</p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Star your files in the Note Manager to save them here for instant review.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {bookmarks.map((note) => (
            <div 
              key={note.id} 
              className="glass rounded-3xl border border-border/60 p-5 flex flex-col justify-between gap-5 bg-gradient-to-br from-card to-background hover:shadow-lg transition-all group relative overflow-hidden"
            >
              
              {/* Header section */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground leading-snug line-clamp-1 group-hover:text-primary transition-all">
                      {note.title}
                    </h4>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5">
                      {note.fileType || 'Document'} • {formatFileSize(note.fileSize)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={(e) => handleToggleBookmark(note.id, e)}
                  className="p-1.5 rounded-xl border bg-amber-500/10 border-amber-500/30 text-amber-500 transition-all hover:bg-secondary shrink-0"
                  title="Remove from bookmarks"
                >
                  <Star size={14} fill="currentColor" />
                </button>
              </div>

              {/* Description */}
              {note.description && (
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 pl-1">
                  {note.description}
                </p>
              )}

              {/* Study Action Shortcuts */}
              <div className="grid grid-cols-2 gap-2 border-t pt-4 border-border/40">
                <button
                  onClick={() => navigate(`/summaries?noteId=${note.id}`)}
                  className="py-2 bg-secondary/50 hover:bg-primary/5 hover:text-primary border border-border/60 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <FileText size={12} /> Summaries
                </button>
                <button
                  onClick={() => navigate(`/flashcards?noteId=${note.id}`)}
                  className="py-2 bg-secondary/50 hover:bg-primary/5 hover:text-primary border border-border/60 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <Layers size={12} /> Flashcards
                </button>
                <button
                  onClick={() => navigate(`/quizzes?noteId=${note.id}`)}
                  className="py-2 bg-secondary/50 hover:bg-primary/5 hover:text-primary border border-border/60 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <Award size={12} /> Quizzes
                </button>
                <button
                  onClick={() => navigate(`/chat?noteId=${note.id}`)}
                  className="py-2 bg-secondary/50 hover:bg-primary/5 hover:text-primary border border-border/60 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <MessageSquare size={12} /> AI Tutor
                </button>
              </div>

              {/* Bottom footer metadata */}
              <div className="text-[9px] text-muted-foreground flex justify-between items-center mt-2 border-t pt-3 border-border/20">
                <span>Uploaded {new Date(note.createdAt).toLocaleDateString()}</span>
                <button 
                  onClick={() => navigate(`/notes`)}
                  className="text-primary font-bold flex items-center gap-0.5 hover:underline"
                >
                  View Details <ChevronRight size={10} />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </PageContainer>
  );
};

export default Bookmarks;
