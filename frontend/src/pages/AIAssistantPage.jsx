import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { currentUser } from '../services/mockData';
import { getPatients, queryClinicalRag } from '../services/api';
import {
  Bot,
  Send,
  Sparkles,
  Users,
  BookOpen,
  ExternalLink,
  Loader2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Stethoscope,
  Pill,
  Heart,
  RefreshCw,
} from 'lucide-react';

export default function AIAssistantPage() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hello Dr. Sharma. I am **Clinora AI Copilot**, your clinical decision support assistant. I can semantically search patient medical records, verify medication dosages, compare laboratory panels, and synthesize evidence-backed clinical summaries.\n\nSelect a patient to narrow your search or ask a question across all authorized records.",
      citations: [],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchPatientsList = async () => {
      try {
        const res = await getPatients(1, 50);
        if (res.patients) setPatients(res.patients);
      } catch {
        // Fallback
      }
    };
    fetchPatientsList();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const quickPrompts = [
    'What medications is Emily Johnson currently taking?',
    'Summarize recent cardiovascular findings',
    'List all patients with hypertension',
    'Check vital signs and blood pressure trends',
  ];

  const handleSendMessage = async (queryToSend = inputQuery) => {
    if (!queryToSend.trim() || loading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: queryToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await queryClinicalRag({
        query: queryToSend.trim(),
        patientId: selectedPatientId || null,
        topK: 4,
      });

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.answer,
        citations: res.citations || [],
        modelUsed: res.model_used,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ ${err.message || 'Unable to query clinical records. Please ensure backend server is active.'}`,
        citations: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content: 'Conversation history cleared. Ready for your next clinical query.',
        citations: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="flex min-h-screen bg-brand-surface font-sans text-slate-900">
      <Sidebar />

      <div className="flex flex-1 flex-col ml-60 min-w-0">
        <Topbar breadcrumb="CLINORA / AI ASSISTANT" title="Clinical AI Decision Support" />

        <main className="flex-1 flex flex-col p-8 max-w-7xl mx-auto w-full gap-4">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">Clinical AI Copilot</h1>
                <Badge variant="default" className="text-[10px]">
                  RAG Neural Search
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Evidence-grounded medical question answering with verified source citations.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Patient Filter Dropdown */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-sm">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="bg-transparent text-xs text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="">All Patients (Global Search)</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name || `${p.first_name} ${p.last_name}`}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs border-slate-200 text-slate-600 hover:bg-slate-50"
                onClick={handleClearHistory}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear Chat
              </Button>
            </div>
          </div>

          {/* Chat Feed Box */}
          <div className="flex-1 min-h-[500px] flex flex-col justify-between rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {/* Scrollable Message List */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[600px]">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-3 max-w-3xl ${m.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                >
                  {/* Avatar */}
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                      m.role === 'user'
                        ? 'bg-brand-purple text-white'
                        : 'bg-brand-purpleLight text-brand-purple'
                    }`}
                  >
                    {m.role === 'user' ? 'DR' : <Bot className="h-4 w-4" />}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`space-y-2 rounded-2xl p-4 text-xs leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-brand-purple text-white rounded-tr-none'
                        : 'bg-slate-50 border border-slate-200/80 text-slate-800 rounded-tl-none shadow-sm'
                    }`}
                  >
                    <div className={`flex items-center justify-between gap-4 text-[10px] pb-1.5 border-b ${m.role === 'user' ? 'text-purple-200 border-purple-400/30' : 'text-slate-400 border-slate-200'}`}>
                      <span className="font-semibold">
                        {m.role === 'user' ? 'Dr. S. Vance' : 'Clinora AI Copilot'}
                      </span>
                      <span>{m.timestamp}</span>
                    </div>

                    <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>

                    {/* Citations */}
                    {m.citations && m.citations.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-slate-200 mt-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700">
                          <BookOpen className="h-3 w-3" />
                          <span>Verified Citations ({m.citations.length}):</span>
                        </div>
                        <div className="grid grid-cols-1 gap-1.5">
                          {m.citations.map((c, idx) => (
                            <div
                              key={idx}
                              onClick={() => navigate(`/documents/${c.document_id}`)}
                              className="flex items-center justify-between rounded-md bg-white p-2 border border-slate-200 hover:border-brand-purple transition-colors cursor-pointer shadow-xs"
                            >
                              <div className="truncate pr-2">
                                <span className="font-semibold text-slate-900">[{c.document_title}]</span>
                                <span className="text-slate-500 text-[10px] ml-1.5">
                                  {c.patient_name || 'Patient'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <Badge variant="mint" className="text-[9px]">
                                  {(c.similarity_score * 100).toFixed(0)}% Match
                                </Badge>
                                <ExternalLink className="h-2.5 w-2.5 text-slate-400" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-3 max-w-3xl">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-purpleLight text-brand-purple">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-2xl rounded-tl-none bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-brand-purple" />
                    <span>Searching clinical vector embeddings and synthesizing answer...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Input Area */}
            <div className="p-4 border-t border-slate-200 bg-slate-50/50 space-y-2.5">
              {/* Quick Prompt Chips */}
              <div className="flex flex-wrap gap-1.5">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSendMessage(prompt)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-700 transition-colors hover:border-brand-purple hover:text-brand-purple shadow-xs"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Text Input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ask a clinical question (e.g. 'What is the dosage of Amlodipine for Emily?')..."
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-4 pr-16 py-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple shadow-xs"
                />
                <Button
                  size="sm"
                  variant="default"
                  disabled={loading || !inputQuery.trim()}
                  className="absolute right-2 top-2 h-8 px-3 font-semibold text-xs"
                  onClick={() => handleSendMessage()}
                >
                  {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
