import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import { StatCard } from '../components/ui/stat-card';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { currentUser, recentDocuments as fallbackDocs } from '../services/mockData';
import {
  queryClinicalRag,
  getAnalyticsSummary,
  getDocuments,
} from '../services/api';
import {
  Users,
  FileText,
  Clock,
  Bot,
  Sparkles,
  ArrowRight,
  Filter,
  FileCheck,
  Send,
  TrendingUp,
  Loader2,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Brain,
  Network,
  Activity,
  Layers,
} from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [aiQuery, setAiQuery] = useState('');
  const [ragLoading, setRagLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [ragError, setRagError] = useState('');
  const [liveStats, setLiveStats] = useState(null);
  const [recentDocs, setRecentDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(true);

  const quickPrompts = [
    'What medications is Emily Johnson taking?',
    "What is Evelyn Carter's cancer diagnosis?",
    'Summarize recent cardiology findings',
    'What mutation was found in Marcus Chen report?',
  ];

  // Load live analytics and recent documents
  useEffect(() => {
    async function loadDashboardData() {
      try {
        const stats = await getAnalyticsSummary();
        setLiveStats(stats);
      } catch (err) {
        console.error('Failed to load live stats for dashboard:', err);
      }

      try {
        const docsRes = await getDocuments({ perPage: 5 });
        if (docsRes?.items && docsRes.items.length > 0) {
          setRecentDocs(docsRes.items);
        } else {
          setRecentDocs(fallbackDocs.slice(0, 5));
        }
      } catch (err) {
        console.error('Failed to load recent documents:', err);
        setRecentDocs(fallbackDocs.slice(0, 5));
      } finally {
        setDocsLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const handleAskRAG = async (queryText = aiQuery) => {
    if (!queryText || !queryText.trim() || ragLoading) return;
    const cleanQuery = queryText.trim();
    setRagLoading(true);
    setRagError('');
    setAiQuery('');

    try {
      const res = await queryClinicalRag({ query: cleanQuery });
      setChatHistory((prev) => [...prev, { query: cleanQuery, response: res }]);
    } catch (err) {
      setRagError(err.message || 'Clinical AI query failed. Please check backend connection.');
    } finally {
      setRagLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Sidebar />

      <div className="flex flex-1 flex-col ml-64 min-w-0">
        <Topbar user={currentUser} />

        <main className="flex-1 space-y-6 p-8">
          {/* Top Welcome Banner */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-2xl border border-brand-purple/20 bg-gradient-to-r from-brand-purple/10 via-slate-900/40 to-slate-900/60 p-6 backdrop-blur-md">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">Clinical Operations Overview</h1>
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                  RAG & AI Active
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Neural vector indexing, Knowledge Graphs, and Task-Focused Clinical Agents active across hospital records.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/agents')}
                className="text-xs border-purple-500/30 hover:bg-purple-950/40 text-purple-300"
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5 text-brand-coral" />
                AI Agents Hub
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/knowledge-graph')}
                className="text-xs border-white/10 hover:bg-white/5"
              >
                <Network className="mr-1.5 h-3.5 w-3.5 text-brand-lavender" />
                Knowledge Graph
              </Button>
              <Button
                variant="coral"
                size="sm"
                onClick={() => navigate('/documents')}
                className="text-xs"
              >
                <FileText className="mr-1.5 h-3.5 w-3.5" />
                Upload Document
              </Button>
            </div>
          </div>

          {/* 4 Stat Cards Row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Patients"
              value={liveStats ? liveStats.total_patients.toLocaleString() : '1,250'}
              trend="+15.2%"
              trendUp={true}
              icon={Users}
              color="purple"
            />
            <StatCard
              label="Documents Processed"
              value={liveStats ? liveStats.processed_documents.toLocaleString() : '3,480'}
              trend={liveStats ? `${liveStats.ocr_success_rate}% Accuracy` : '-2.1%'}
              trendUp={true}
              icon={FileCheck}
              color="blue"
            />
            <StatCard
              label="Pending Documents"
              value={liveStats ? liveStats.pending_documents.toLocaleString() : '145'}
              trend="Queue Active"
              trendUp={true}
              icon={Clock}
              color="amber"
            />
            <StatCard
              label="AI RAG & Agent Queries"
              value={liveStats ? liveStats.rag_queries_answered.toLocaleString() : '892'}
              trend="+22.8%"
              trendUp={true}
              icon={Bot}
              color="mint"
            />
          </div>

          {/* Bento Grid: Documents Table + Processing Velocity + Clinora AI Assistant */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left 7 Columns: Recent Documents Table */}
            <Card className="lg:col-span-7 flex flex-col justify-between border-white/[0.08] bg-slate-900/80 backdrop-blur-xl">
              <CardHeader className="flex flex-row items-center justify-between border-b border-white/[0.04] pb-4">
                <div>
                  <CardTitle className="text-sm font-bold text-white">Recent Clinical Documents</CardTitle>
                  <p className="text-xs text-slate-400">Recently uploaded medical charts, prescriptions, and lab records</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/documents')}
                  className="h-7 text-xs border-white/10"
                >
                  <Filter className="mr-1 h-3 w-3" />
                  View All
                </Button>
              </CardHeader>

              <CardContent className="p-0 flex-1">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-white/[0.06]">
                      <tr>
                        <th className="py-3 px-4">Document</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {recentDocs.map((doc) => (
                        <tr
                          key={doc.id}
                          className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                          onClick={() => navigate(`/documents/${doc.id}`)}
                        >
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-slate-200 truncate max-w-[180px]">
                              {doc.title || doc.name || doc.original_filename}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">{doc.id.slice(0, 12)}...</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                              {(doc.document_type || doc.type || 'Clinical Note').replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge
                              variant={doc.status === 'processed' ? 'mint' : doc.status === 'processing' ? 'purple' : 'amber'}
                              className="text-[10px]"
                            >
                              {doc.status || 'processed'}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                            {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : (doc.date || 'Today')}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <span className="text-xs font-semibold text-brand-lavender hover:text-white transition-colors">
                              View →
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>

              <div className="border-t border-white/[0.04] p-3 text-center bg-slate-950/40">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-slate-400 hover:text-white"
                  onClick={() => navigate('/documents')}
                >
                  Explore All Clinical Records <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>

            {/* Right 5 Columns: Clinora RAG AI Assistant */}
            <div className="flex flex-col gap-6 lg:col-span-5">
              <Card className="flex flex-col border-brand-purple/30 bg-gradient-to-b from-brand-purple/10 to-slate-900/90 shadow-lg shadow-brand-purple/5">
                <CardHeader className="pb-3 border-b border-white/[0.04]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-coral text-white font-bold shadow-md shadow-brand-coral/20">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-bold text-white">Clinora RAG Assistant</CardTitle>
                        <p className="text-[11px] text-slate-400">Grounded semantic search across patient corpus</p>
                      </div>
                    </div>
                    <Badge variant="mint" className="text-[9px]">Grounded RAG</Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-3 flex-1 flex flex-col justify-between">
                  {/* Prompt Box */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {quickPrompts.map((prompt, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleAskRAG(prompt)}
                          disabled={ragLoading}
                          className="rounded-lg bg-slate-950/80 border border-white/[0.08] px-2.5 py-1 text-[11px] text-slate-300 hover:bg-brand-purple/20 hover:border-brand-purple/40 hover:text-white transition-all text-left"
                        >
                          "{prompt}"
                        </button>
                      ))}
                    </div>

                    <div className="relative mt-2">
                      <input
                        type="text"
                        value={aiQuery}
                        onChange={(e) => setAiQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAskRAG()}
                        placeholder="Ask medical question across all records..."
                        disabled={ragLoading}
                        className="w-full rounded-xl bg-slate-950 border border-white/10 py-2.5 pl-3.5 pr-10 text-xs text-white placeholder-slate-500 focus:border-brand-purple/50 focus:outline-none focus:ring-1 focus:ring-brand-purple/30"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleAskRAG()}
                        disabled={ragLoading || !aiQuery.trim()}
                        className="absolute right-1 top-1 h-7 w-7 text-brand-lavender hover:bg-brand-purple/20 hover:text-white"
                      >
                        {ragLoading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-coral" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* RAG Error Banner */}
                  {ragError && (
                    <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{ragError}</span>
                    </div>
                  )}

                  {/* RAG Multi-Turn Answers Display */}
                  {chatHistory.length > 0 && (
                    <div className="mt-3 space-y-3 max-h-96 overflow-y-auto pr-1">
                      {chatHistory.map((item, i) => (
                        <div key={i} className="space-y-2 rounded-xl border border-brand-purple/30 bg-slate-950/90 p-3.5 shadow-inner">
                          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                            <span className="text-[11px] font-semibold text-brand-coral">Q: {item.query}</span>
                            <Badge variant="outline" className="text-[9px] text-brand-lavender border-brand-purple/40">
                              {item.response.model_used}
                            </Badge>
                          </div>

                          <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                            {item.response.answer}
                          </div>

                          {/* Source Document Citations */}
                          {item.response.citations && item.response.citations.length > 0 && (
                            <div className="space-y-1.5 pt-2 border-t border-white/[0.08]">
                              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                                <BookOpen className="h-3 w-3 text-emerald-400" />
                                <span>Citations ({item.response.citations.length}):</span>
                              </div>
                              <div className="space-y-1">
                                {item.response.citations.map((c, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between rounded-lg bg-slate-900/80 p-1.5 border border-white/[0.05] hover:border-brand-purple/30 transition-colors cursor-pointer text-[11px]"
                                    onClick={() => navigate(`/documents/${c.document_id}`)}
                                  >
                                    <div className="truncate pr-2">
                                      <span className="font-semibold text-white">[{c.document_title}]</span>
                                      <span className="text-slate-400 ml-1">({c.patient_name || 'Patient'})</span>
                                    </div>
                                    <Badge variant="mint" className="text-[9px] px-1 py-0 shrink-0">
                                      {(c.similarity_score * 100).toFixed(0)}% Match
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Processing Activity Velocity */}
              <Card className="border-white/[0.08] bg-slate-900/80 backdrop-blur-xl">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    <CardTitle className="text-xs font-bold text-white">Document Processing Velocity</CardTitle>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">Past 9 Months</span>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between gap-2 h-24 pt-3">
                    {[
                      { m: 'Jan', h: '65%' },
                      { m: 'Feb', h: '45%' },
                      { m: 'Mar', h: '80%' },
                      { m: 'Apr', h: '55%' },
                      { m: 'May', h: '70%' },
                      { m: 'Jun', h: '95%' },
                      { m: 'Jul', h: '60%' },
                      { m: 'Aug', h: '75%' },
                      { m: 'Sep', h: '85%' },
                    ].map((item) => (
                      <div key={item.m} className="flex flex-1 flex-col items-center gap-1.5">
                        <div className="w-full flex items-end gap-0.5 h-16 bg-white/[0.02] rounded-t">
                          <div
                            style={{ height: item.h }}
                            className="w-full rounded-t bg-gradient-to-t from-brand-purple to-brand-coral opacity-85 transition-all hover:opacity-100"
                          />
                        </div>
                        <span className="text-[9px] text-slate-500 font-medium">{item.m}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
