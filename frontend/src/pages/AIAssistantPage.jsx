import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { currentUser } from '../services/mockData';
import { queryClinicalRag, reindexVectorStore } from '../services/api';
import {
  Bot,
  Sparkles,
  Send,
  Loader2,
  BookOpen,
  ExternalLink,
  RotateCcw,
  User,
  ShieldCheck,
  Search,
  Database,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

export default function AIAssistantPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hello, Dr. Sharma. I am the Clinora AI Clinical Assistant. I can search across all digitized patient medical records, lab panels, and oncology pathology reports to answer clinical questions with grounded citations. How can I assist you today?',
      citations: [],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState('all');
  const [reindexing, setReindexing] = useState(false);
  const [reindexSuccess, setReindexSuccess] = useState(false);
  const messagesEndRef = useRef(null);

  const suggestedPrompts = [
    { label: 'Evelyn Carter Oncology', query: "What is Evelyn Carter's cancer diagnosis and current medication regimen?" },
    { label: 'Marcus Chen Genomics', query: 'What mutation was found in Marcus Chen genomic sequencing report?' },
    { label: 'Emily Johnson Cardiology', query: 'What medications is Emily Johnson taking and what were her vitals?' },
    { label: 'Hypertension Cohort', query: 'Show all patients diagnosed with hypertension and their prescribed drugs.' },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (textToSend = inputQuery) => {
    if (!textToSend || !textToSend.trim() || loading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const patientFilter = selectedPatient === 'all' ? null : selectedPatient;
      const res = await queryClinicalRag({
        query: textToSend.trim(),
        patientId: patientFilter,
        topK: 4,
      });

      const assistantMsg = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: res.answer,
        citations: res.citations || [],
        modelUsed: res.model_used,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        text: `Clinical query failed: ${err.message || 'Unable to connect to RAG server'}. Please ensure the backend is running.`,
        citations: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleReindex = async () => {
    setReindexing(true);
    setReindexSuccess(false);
    try {
      await reindexVectorStore();
      setReindexSuccess(true);
      setTimeout(() => setReindexSuccess(false), 4000);
    } catch (err) {
      alert(`Reindexing failed: ${err.message}`);
    } finally {
      setReindexing(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        text: 'Chat history cleared. How can I assist you with clinical records today?',
        citations: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Sidebar />

      <div className="flex flex-1 flex-col ml-64 min-w-0">
        <Topbar user={currentUser} />

        <main className="flex-1 flex flex-col p-6 max-w-6xl mx-auto w-full h-[calc(100vh-64px)] overflow-hidden">
          {/* Top Control Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08] shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-purple to-brand-coral text-white shadow-lg shadow-brand-purple/20">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-white tracking-tight">Clinical AI & RAG Intelligence</h1>
                  <span className="rounded-full bg-brand-coral/20 px-2 py-0.5 text-[10px] font-bold text-brand-coral border border-brand-coral/30">
                    Phase 7 RAG Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Grounded multi-modal clinical intelligence powered by ChromaDB vector search and LLM extraction.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Patient Filter */}
              <select
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                className="h-8 rounded-lg border border-white/10 bg-slate-900 px-2.5 text-xs text-slate-200 focus:outline-none focus:border-brand-purple"
              >
                <option value="all">All Patient Records</option>
                <option value="c1a2b3c4-d5e6-4a1b-8c2d-3e4f5a6b7001">Evelyn Carter (MRN-902-18)</option>
                <option value="b2c3d4e5-f6a7-4b2c-9d3e-4f5a6b7c8002">Marcus Chen (MRN-334-09)</option>
                <option value="ed1a2a90-bb7e-4ce3-aa0d-504c3a9a0001">Emily Johnson (PAT-2026-00001)</option>
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={handleReindex}
                disabled={reindexing}
                className="h-8 text-xs text-slate-300 border-white/10 bg-slate-900 hover:bg-slate-800"
              >
                {reindexing ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin text-brand-coral" />
                ) : reindexSuccess ? (
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Database className="mr-1.5 h-3.5 w-3.5 text-brand-lavender" />
                )}
                {reindexing ? 'Indexing...' : reindexSuccess ? 'Indexed!' : 'Re-index'}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearHistory}
                className="h-8 px-2 text-xs text-slate-400 hover:text-slate-200"
                title="Clear Chat History"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Prompts Bar */}
          <div className="py-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 border-b border-white/[0.04]">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-brand-coral" />
              Suggested:
            </span>
            {suggestedPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p.query)}
                className="whitespace-nowrap rounded-lg border border-white/10 bg-slate-900/60 px-2.5 py-1 text-xs text-slate-300 hover:border-brand-purple/50 hover:bg-slate-800 hover:text-white transition-all shadow-sm shrink-0"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Chat Messages Container */}
          <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-1">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${
                  msg.role === 'user' ? 'ml-auto justify-end' : 'mr-auto justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-purple/20 border border-brand-purple/40 text-brand-lavender">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`rounded-2xl p-4 text-xs leading-relaxed space-y-2.5 shadow-lg ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-brand-purple to-brand-coral text-white font-medium rounded-tr-none max-w-xl'
                      : msg.isError
                      ? 'bg-red-500/10 border border-red-500/20 text-red-300 rounded-tl-none w-full'
                      : 'bg-slate-900/90 border border-white/[0.08] text-slate-200 rounded-tl-none w-full backdrop-blur-md'
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>

                  {/* Citations list if present */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/[0.08] space-y-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                        <BookOpen className="h-3 w-3 text-emerald-400" />
                        <span>Source Document Citations ({msg.citations.length}):</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {msg.citations.map((c, idx) => (
                          <div
                            key={idx}
                            onClick={() => navigate(`/documents/${c.document_id}`)}
                            className="flex flex-col justify-between p-2.5 rounded-lg bg-slate-950/80 border border-white/[0.06] hover:border-brand-purple/50 transition-colors cursor-pointer group"
                          >
                            <div className="flex items-start justify-between gap-1">
                              <span className="font-semibold text-[11px] text-white group-hover:text-brand-lavender truncate">
                                [{c.document_title}]
                              </span>
                              <Badge variant="mint" className="text-[9px] px-1 py-0 shrink-0">
                                {(c.similarity_score * 100).toFixed(0)}% Match
                              </Badge>
                            </div>
                            <span className="text-[10px] text-slate-400 mt-1">
                              Patient: {c.patient_name || 'Patient'} ({c.patient_id || 'N/A'})
                            </span>
                            <p className="text-[10px] text-slate-500 line-clamp-2 mt-1 italic">
                              "{c.excerpt}"
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    {msg.modelUsed && (
                      <span className="font-mono text-[9px] text-slate-400">Engine: {msg.modelUsed}</span>
                    )}
                    <span className="ml-auto">{msg.timestamp}</span>
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-coral/20 border border-brand-coral/40 text-brand-coral">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 max-w-xl mr-auto">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-purple/20 border border-brand-purple/40 text-brand-lavender">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-2xl rounded-tl-none bg-slate-900/90 border border-white/[0.08] p-4 text-xs text-slate-300 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-brand-coral" />
                  <span>Searching vector database & synthesizing grounded clinical findings...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="pt-3 border-t border-white/[0.08] shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="relative flex items-center"
            >
              <input
                type="text"
                placeholder="Ask about patient conditions, lab results, medications, or oncology biomarkers..."
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                disabled={loading}
                className="w-full h-12 rounded-xl border border-white/10 bg-slate-900/90 pl-4 pr-14 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-brand-purple shadow-inner"
              />
              <Button
                type="submit"
                variant="coral"
                disabled={loading || !inputQuery.trim()}
                className="absolute right-2 h-8 px-3 text-xs font-semibold"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </Button>
            </form>
            <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 pt-1.5">
              <span>Grounded in ChromaDB clinical vector embeddings.</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-emerald-400" />
                HIPAA-Compliant Patient Context
              </span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
