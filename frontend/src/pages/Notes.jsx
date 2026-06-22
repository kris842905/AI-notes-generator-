import React, { useState, useEffect } from 'react';
import PageContainer from '../components/layout/PageContainer';
import { 
  Plus, FileText, Trash2, Bookmark, BookmarkCheck, ExternalLink, 
  FileCode, Image as ImageIcon, Music, Search, ArrowLeft, Upload, Loader2 
} from 'lucide-react';
import api from '../services/api';

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState(null);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notes?size=50');
      setNotes(res.data.content || []);
    } catch (err) {
      console.error('Failed to fetch notes', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setUploadError('');
    if (!file || !title) {
      setUploadError('Please specify a title and select a file.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('description', description);

    try {
      await api.post('/notes/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setShowUploadModal(false);
      setTitle('');
      setDescription('');
      setFile(null);
      fetchNotes();
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Upload and processing failed. Ensure API keys are active.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note? All summaries and quizzes will be deleted.')) {
      return;
    }
    try {
      await api.delete(`/notes/${noteId}`);
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
      }
      fetchNotes();
    } catch (err) {
      console.error('Failed to delete note', err);
    }
  };

  const toggleBookmark = async (noteId) => {
    try {
      const res = await api.post(`/notes/${noteId}/bookmark`);
      setNotes(prev => prev.map(note => 
        note.id === noteId ? { ...note, isBookmarked: res.data.bookmarked } : note
      ));
      if (selectedNote?.id === noteId) {
        setSelectedNote(prev => ({ ...prev, isBookmarked: res.data.bookmarked }));
      }
    } catch (err) {
      console.error('Failed to toggle bookmark', err);
    }
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'IMAGE': return <ImageIcon size={20} />;
      case 'AUDIO': return <Music size={20} />;
      default: return <FileText size={20} />;
    }
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (note.description && note.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <PageContainer title="My Study Notes" subtitle="Upload documents, recordings, or handwritten notes, and manage your assets.">
      {selectedNote ? (
        // Detailed note viewer
        <div className="flex flex-col gap-6 animate-fade-in">
          <div className="flex items-center justify-between border-b pb-4 mb-2">
            <button 
              onClick={() => setSelectedNote(null)}
              className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={16} /> Back to Notes
            </button>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => toggleBookmark(selectedNote.id)}
                className="p-2 rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                {selectedNote.isBookmarked ? <BookmarkCheck className="text-primary" size={18} /> : <Bookmark size={18} />}
              </button>
              <button 
                onClick={() => handleDelete(selectedNote.id)}
                className="p-2 rounded-xl bg-secondary hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-wider rounded-full bg-primary/10 text-primary uppercase">
                {selectedNote.fileType}
              </span>
              <span className="text-xs text-muted-foreground">
                Uploaded {new Date(selectedNote.createdAt).toLocaleDateString()}
              </span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground mt-2">{selectedNote.title}</h2>
            {selectedNote.description && <p className="text-sm text-muted-foreground mt-1.5">{selectedNote.description}</p>}
          </div>

          {selectedNote.fileUrl && (
            <div className="flex">
              <a 
                href={selectedNote.fileUrl} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-secondary hover:bg-muted text-foreground transition-all border"
              >
                <ExternalLink size={14} /> Open Original Attachment
              </a>
            </div>
          )}

          <div className="glass rounded-3xl p-6 border border-border/60">
            <h3 className="font-bold text-lg text-foreground border-b pb-2.5 mb-4">Extracted Text Content</h3>
            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto scroll-thin pr-2">
              {selectedNote.textContent}
            </div>
          </div>
        </div>
      ) : (
        // Notes grid view
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-secondary/40 border border-border focus:border-primary rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              />
            </div>

            {/* Upload Button */}
            <button
              onClick={() => setShowUploadModal(true)}
              className="w-full sm:w-auto px-4 py-2.5 bg-primary text-white rounded-2xl text-sm font-semibold hover:bg-primary/95 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
              <Plus size={18} /> Upload Notes
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-20 border border-dashed rounded-3xl p-8 bg-secondary/10 flex flex-col items-center gap-3">
              <FileCode className="text-muted-foreground w-12 h-12" />
              <div>
                <p className="font-bold text-lg text-foreground">No notes found</p>
                <p className="text-xs text-muted-foreground">Upload document, audio or image to auto generate summaries and quizzes.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
              {filteredNotes.map((note) => (
                <div 
                  key={note.id}
                  className="glass rounded-3xl border border-border/60 p-5 hover:shadow-lg transition-all duration-200 flex flex-col justify-between group cursor-pointer"
                  onClick={() => setSelectedNote(note)}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="p-2.5 rounded-xl bg-secondary text-primary shrink-0">
                        {getFileIcon(note.fileType)}
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBookmark(note.id);
                        }}
                        className="text-muted-foreground hover:text-primary transition-colors p-1"
                      >
                        {note.isBookmarked ? <BookmarkCheck className="text-primary" size={18} /> : <Bookmark size={18} />}
                      </button>
                    </div>

                    <div className="mt-4">
                      <h3 className="font-bold text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors duration-150">
                        {note.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">
                        {note.description || 'No description provided.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t mt-5 pt-3 text-[10px] font-semibold text-muted-foreground">
                    <span className="uppercase tracking-wider px-2 py-0.5 rounded bg-secondary">{note.fileType}</span>
                    <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upload Dialog */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-card rounded-3xl border border-border p-6 shadow-2xl animate-slide-up flex flex-col gap-4">
            <h3 className="font-bold text-xl text-foreground">Upload Study Material</h3>

            {uploadError && (
              <div className="p-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                <span className="font-medium">{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="flex flex-col gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase pl-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. CS101 Lecture 1 - Binary Trees"
                  className="w-full px-4 py-2.5 bg-secondary/50 border border-border focus:border-primary rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase pl-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description about the file topics..."
                  rows={2}
                  className="w-full px-4 py-2.5 bg-secondary/50 border border-border focus:border-primary rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase pl-1">File Attachment</label>
                <div className="border border-dashed border-border/80 rounded-2xl p-6 text-center hover:bg-secondary/20 transition-colors flex flex-col items-center gap-2 relative">
                  <input
                    type="file"
                    accept=".pdf,.docx,.pptx,.txt,image/*,audio/*"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    required
                  />
                  <Upload className="text-muted-foreground" size={24} />
                  <div>
                    <span className="text-xs font-medium text-foreground block">
                      {file ? file.name : 'Click to select file'}
                    </span>
                    <span className="text-[10px] text-muted-foreground block mt-0.5">
                      Supports PDF, DOCX, PPTX, TXT, PNG, JPG, MP3, WAV (Max 50MB)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2.5 rounded-2xl bg-secondary text-sm font-semibold hover:bg-muted text-foreground transition-all"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2.5 bg-primary text-white rounded-2xl text-sm font-semibold hover:bg-primary/95 transition-all shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Processing AI Embeddings...
                    </>
                  ) : (
                    'Upload & Generate'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default Notes;
