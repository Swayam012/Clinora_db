import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { currentUser } from '../services/mockData';
import { queryClinicalRag, reindexVectorStore, getPatients } from '../services/api';
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

function renderInline(str) {
  if (!str) return '';
  const parts = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIndex) {
      parts.push(str.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(<strong key={match.index} className="text-white font-semibold">{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(<code key={match.index} className="px-1.5 py-0.5 rounded bg-slate-800 text-brand-lavender font-mono text-[11px]">{token.slice(1, -1)}</code>);
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(<em key={match.index} className="text-slate-400 italic">{token.slice(1, -1)}</em>);
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < str.length) {
    parts.push(str.substring(lastIndex));
  }

  return parts.length > 0 ? parts : str;
}

function formatClinicalMarkdown(text) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      elements.push(<div key={lineIdx} className="h-1.5" />);
      return;
    }

    if (trimmed.startsWith('### ')) {
      elements.push(
        <h3 key={lineIdx} className="text-xs font-bold text-brand-lavender mt-2 mb-1 flex items-center gap-1.5">
          {renderInline(trimmed.replace(/^###\s+/, ''))}
        </h3>
      );
      return;
    }

    if (trimmed.startsWith('#### ')) {
      elements.push(
        <h4 key={lineIdx} className="text-[11px] font-semibold text-slate-100 mt-2 mb-0.5">
          {renderInline(trimmed.replace(/^####\s+/, ''))}
        </h4>
      );
      return;
    }

    if (trimmed === '---') {
      elements.push(<hr key={lineIdx} className="border-white/10 my-2" />);
      return;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      elements.push(
        <div key={lineIdx} className="flex items-start gap-1.5 pl-1.5 text-slate-200 py-0.5">
          <span className="text-brand-coral font-bold shrink-0">•</span>
          <span className="text-[11.5px] leading-relaxed">{renderInline(trimmed.substring(2))}</span>
        </div>
      );
      return;
    }

    if (trimmed.startsWith('> ')) {
      elements.push(
        <div key={lineIdx} className="border-l-2 border-brand-purple/50 pl-2.5 py-1 text-slate-300 italic my-1 bg-brand-purple/5 rounded-r">
          {renderInline(trimmed.substring(2))}
        </div>
      );
      return;
    }

    elements.push(
      <p key={lineIdx} className="leading-relaxed text-slate-200 text-[11.5px]">
        {renderInline(trimmed)}
      </p>
    );
  });

  return elements;
}

export default function AIAssistantPage() {
  const [user, setUser] = useState(null);
  const [patientsList, setPatientsList] = useState([]);
  useEffect(() => {
    import('../services/api').then(m => m.getCurrentUser().then(u => u && setUser(u)).catch(() => {}));
    getPatients(1, 100).then(res => {
      if (res?.patients) setPatientsList(res.patients);
    }).catch(err => console.debug('Failed to fetch patients list for AI Assistant:', err));
  }, []);
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hello. I am the Clinora AI Clinical Assistant. I can search across all digitized patient medical records, lab panels, and clinical documents to answer questions with grounded citations. How can I assist you today?',
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
    { label: 'Medication Reconciliation', query: 'What active medications, dosages, and administration frequencies are documented?' },
    { label: 'Clinical Summary', query: 'Summarize the primary diagnoses and clinical history across recent documents.' },
    { label: 'Lab Findings & Abnormalities', query: 'Check the latest laboratory test results for any abnormal or out-of-range values.' },
    { label: 'Vital Signs & Treatment Plan', query: 'What were the documented vital signs and physician recommendations from recent consultations?' },
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
        <Topbar user={user} />

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
                {patientsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name} ({p.patient_id})
                  </option>
                ))}
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
                  <div className="leading-relaxed">
                    {msg.role === 'assistant' ? formatClinicalMarkdown(msg.text) : (
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                    )}
                  </div>

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
