import React, { useState, useEffect, useRef } from 'react';
import PageContainer from '../components/layout/PageContainer';
import { Send, Sparkles, MessageSquare, RefreshCw, BookOpen, User, BookOpenCheck, HelpCircle } from 'lucide-react';
import api from '../services/api';

const Chat = () => {
  const [notes, setNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

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

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !selectedNoteId || loading) return;

    const userMessage = {
      sender: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post(`/chat?noteId=${selectedNoteId}`, {
        message: userMessage.text
      });

      const aiMessage = {
        sender: 'ai',
        text: res.data.reply,
        sources: res.data.sources || [],
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error('Failed to chat with note', err);
      const errorMessage = {
        sender: 'ai',
        text: 'Sorry, I encountered an error connecting to my database or the Gemini API. Please make sure ChromaDB is running or fallback mode is operational, and verify your Gemini API key.',
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const currentNoteTitle = notes.find(n => n.id === Number(selectedNoteId))?.title || 'Selected Document';

  return (
    <PageContainer title="AI Study Tutor" subtitle="Have a smart conversation with your documents. Ask questions, request examples, or clarify complex topics.">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-14rem)] min-h-[500px]">
        
        {/* Left side: Document selector panel */}
        <div className="glass rounded-3xl p-5 border border-border/60 flex flex-col gap-4 h-full">
          <div>
            <h3 className="font-bold text-sm text-foreground uppercase tracking-wider pl-1">Configuration</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5 pl-1">Choose the document context for your tutor.</p>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase pl-1">Study Material</label>
            {notes.length === 0 ? (
              <p className="text-xs text-muted-foreground bg-secondary/30 p-3 rounded-2xl border">
                No notes available. Please upload a file first.
              </p>
            ) : (
              <select
                value={selectedNoteId}
                onChange={(e) => {
                  setSelectedNoteId(e.target.value);
                  handleClearChat();
                }}
                className="w-full px-4 py-2.5 bg-secondary/50 border border-border focus:border-primary rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
              >
                {notes.map(note => (
                  <option key={note.id} value={note.id}>{note.title}</option>
                ))}
              </select>
            )}
          </div>

          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="w-full mt-auto py-2.5 bg-secondary hover:bg-muted border border-border rounded-2xl text-xs font-bold transition-all text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5"
            >
              Clear Current Chat
            </button>
          )}
        </div>

        {/* Right side: Chat interface workspace */}
        <div className="lg:col-span-3 glass rounded-3xl border border-border/60 overflow-hidden flex flex-col justify-between h-full bg-gradient-to-br from-card to-background">
          
          {/* Active Chat Header */}
          <div className="p-4 border-b border-border/60 flex items-center justify-between bg-secondary/20">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Sparkles size={16} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground leading-tight">AI Note Tutor</h4>
                <p className="text-[10px] text-muted-foreground truncate max-w-xs md:max-w-md">
                  Trained on: <span className="font-semibold text-primary">{currentNoteTitle}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Messages scroll area */}
          <div className="flex-grow overflow-y-auto p-5 space-y-4 scroll-thin">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground gap-3 py-10">
                <MessageSquare size={40} className="stroke-1 text-primary animate-bounce" />
                <div className="max-w-xs space-y-1">
                  <p className="font-bold text-sm text-foreground">Interactive AI Tutor Session</p>
                  <p className="text-xs">Ask a question like: <span className="italic">"What are the main concepts in this document?"</span> or <span className="italic">"Summarize page 2."</span></p>
                </div>
                
                {/* Suggestions Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md mt-4">
                  {[
                    "What is the key takeaway?",
                    "Define core terms in this text.",
                    "Explain this topic as if I am 5.",
                    "Create a study guide from this."
                  ].map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInput(s)}
                      className="text-left text-[11px] p-2.5 bg-secondary/40 hover:bg-secondary/80 border border-border/60 rounded-xl transition-all font-semibold flex items-center gap-1.5"
                    >
                      <HelpCircle size={12} className="text-primary shrink-0" />
                      <span>{s}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, idx) => (
                <div 
                  key={idx} 
                  className={`flex gap-3 max-w-[85%] ${m.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                >
                  {/* Avatar bubble */}
                  <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center border text-xs font-bold shadow-sm ${
                    m.sender === 'user' 
                      ? 'bg-secondary text-foreground' 
                      : 'bg-primary text-white border-primary/20'
                  }`}>
                    {m.sender === 'user' ? <User size={14} /> : <Sparkles size={14} />}
                  </div>

                  {/* Text card bubble */}
                  <div className="space-y-2">
                    <div className={`p-4 rounded-[1.5rem] text-sm leading-relaxed shadow-sm ${
                      m.sender === 'user'
                        ? 'bg-primary text-white rounded-tr-none'
                        : 'glass border border-border/60 rounded-tl-none text-foreground'
                    }`}>
                      <p className="whitespace-pre-wrap">{m.text}</p>
                    </div>

                    {/* Source references for AI replies */}
                    {m.sender === 'ai' && m.sources && m.sources.length > 0 && (
                      <div className="pl-1 space-y-1.5">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                          <BookOpenCheck size={11} className="text-primary" /> Verified Citations:
                        </span>
                        <div className="flex flex-col gap-1">
                          {m.sources.map((src, sIdx) => (
                            <details 
                              key={sIdx}
                              className="group text-[10px] bg-secondary/30 border border-border/40 rounded-xl overflow-hidden cursor-pointer hover:bg-secondary/50 transition-all"
                            >
                              <summary className="p-2 font-semibold text-muted-foreground group-open:text-foreground flex items-center justify-between select-none">
                                <span>Reference Chunk #{src.chunkIndex || (sIdx + 1)}</span>
                                <span className="text-[9px] text-primary group-open:hidden">Show Source</span>
                                <span className="text-[9px] text-muted-foreground hidden group-open:inline">Hide</span>
                              </summary>
                              <div className="px-3 pb-3 pt-1 text-muted-foreground border-t border-border/20 italic leading-relaxed whitespace-pre-wrap">
                                "{src.content}"
                              </div>
                            </details>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              ))
            )}
            
            {/* Thinking / typing spinner */}
            {loading && (
              <div className="flex gap-3 max-w-[85%] animate-pulse">
                <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-primary text-white text-xs font-bold border border-primary/25">
                  <Sparkles size={14} />
                </div>
                <div className="p-4 rounded-[1.5rem] rounded-tl-none text-sm bg-secondary/50 border border-border/60 flex items-center gap-2 text-muted-foreground">
                  <RefreshCw size={14} className="animate-spin text-primary" />
                  <span>Consulting document chunks...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form input bar */}
          <form 
            onSubmit={handleSend}
            className="p-4 border-t border-border/60 bg-secondary/10 flex items-center gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={selectedNoteId ? `Message tutor on ${currentNoteTitle}...` : "Select a document first..."}
              disabled={!selectedNoteId || loading}
              className="flex-grow px-5 py-3.5 bg-background border border-border focus:border-primary rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || !selectedNoteId || loading}
              className="p-3.5 bg-primary text-white hover:bg-primary/95 rounded-2xl hover:scale-105 transition-all shadow-md shadow-primary/20 disabled:opacity-40 disabled:scale-100 flex items-center justify-center shrink-0"
            >
              <Send size={16} />
            </button>
          </form>

        </div>

      </div>
    </PageContainer>
  );
};

export default Chat;
