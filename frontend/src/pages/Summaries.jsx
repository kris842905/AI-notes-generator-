import React, { useState, useEffect } from 'react';
import PageContainer from '../components/layout/PageContainer';
import { Sparkles, FileText, Clipboard, Check, RefreshCw } from 'lucide-react';
import api from '../services/api';

const Summaries = () => {
  const [notes, setNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState('');
  const [mode, setMode] = useState('MEDIUM');
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const handleGenerate = async () => {
    if (!selectedNoteId) return;
    setLoading(true);
    setSummary(null);
    try {
      const res = await api.get(`/summaries?noteId=${selectedNoteId}&mode=${mode}`);
      setSummary(res.data);
    } catch (err) {
      console.error('Failed to generate summary', err);
      alert('AI Summarization failed. Make sure your Gemini API key is configured correctly.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const modes = [
    { value: 'SMALL', label: 'Brief', desc: '100-150 words overview' },
    { value: 'MEDIUM', label: 'Structured', desc: '300 words bulleted summary' },
    { value: 'DETAILED', label: 'In-Depth', desc: 'Multi-section comprehensive digest' },
    { value: 'EXAM', label: 'Exam Cram', desc: 'Core formulas, definitions & QA' }
  ];

  return (
    <PageContainer title="AI Notes Summarizer" subtitle="Generate smart summaries from your uploaded documents to boost retention.">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Configuration Card */}
        <div className="glass rounded-3xl p-6 border border-border/60 flex flex-col gap-5 h-fit">
          <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
            <Sparkles size={18} className="text-primary" /> Configuration
          </h3>

          {/* Select Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase pl-1">Select Study Material</label>
            {notes.length === 0 ? (
              <p className="text-xs text-muted-foreground bg-secondary/30 p-3 rounded-2xl border">
                No notes uploaded yet. Please upload a file first.
              </p>
            ) : (
              <select
                value={selectedNoteId}
                onChange={(e) => setSelectedNoteId(e.target.value)}
                className="w-full px-4 py-2.5 bg-secondary/50 border border-border focus:border-primary rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
              >
                {notes.map(note => (
                  <option key={note.id} value={note.id}>{note.title}</option>
                ))}
              </select>
            )}
          </div>

          {/* Select Mode */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase pl-1">Summary Mode</label>
            <div className="flex flex-col gap-2">
              {modes.map(m => (
                <label 
                  key={m.value}
                  onClick={() => setMode(m.value)}
                  className={`flex flex-col p-3 rounded-2xl border cursor-pointer transition-all ${
                    mode === m.value 
                      ? 'bg-primary/5 border-primary text-foreground' 
                      : 'border-border bg-background hover:bg-secondary/40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="summaryMode" 
                      value={m.value} 
                      checked={mode === m.value} 
                      onChange={() => {}} 
                      className="accent-primary"
                    />
                    <span className="text-sm font-semibold">{m.label}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-0.5 pl-5">{m.desc}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !selectedNoteId}
            className="w-full mt-2 py-3 bg-primary text-white rounded-2xl text-sm font-semibold hover:bg-primary/95 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw size={16} className="animate-spin" /> Synthesizing Summary...
              </>
            ) : (
              'Generate Summary'
            )}
          </button>
        </div>

        {/* Display Card */}
        <div className="glass rounded-3xl p-6 border border-border/60 lg:col-span-2 flex flex-col min-h-96 justify-between">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20">
              <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-xs text-muted-foreground animate-pulse">Gemini model is reading your note text...</p>
            </div>
          ) : !summary ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-20 text-muted-foreground gap-3">
              <FileText size={40} className="stroke-1" />
              <div>
                <p className="font-bold text-base text-foreground">No Summary Displayed</p>
                <p className="text-xs text-muted-foreground">Select a note and hit generate to visualize AI outputs here.</p>
              </div>
            </div>
          ) : (
            <div className="flex-grow flex flex-col justify-between h-full animate-fade-in">
              <div>
                <div className="flex items-center justify-between border-b pb-3 mb-5">
                  <div>
                    <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-wider rounded-full bg-primary/10 text-primary uppercase">
                      {summary.mode} Summary
                    </span>
                  </div>
                  <button 
                    onClick={handleCopy}
                    className="p-2 rounded-xl bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground transition-all flex items-center gap-1.5 text-xs font-semibold border"
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <>
                        <Check size={14} className="text-emerald-500" /> Copied!
                      </>
                    ) : (
                      <>
                        <Clipboard size={14} /> Copy Summary
                      </>
                    )}
                  </button>
                </div>

                <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap max-h-[500px] overflow-y-auto scroll-thin pr-2">
                  {summary.content}
                </div>
              </div>

              <div className="text-[10px] text-muted-foreground border-t pt-4 mt-6">
                Generated by Gemini Flash • {new Date(summary.createdAt).toLocaleString()}
              </div>
            </div>
          )}
        </div>

      </div>
    </PageContainer>
  );
};

export default Summaries;
