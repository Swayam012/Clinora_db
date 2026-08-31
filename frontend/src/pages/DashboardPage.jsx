import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import { StatCard } from '../components/ui/stat-card';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { currentUser, recentDocuments } from '../services/mockData';
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
  Mic,
  TrendingUp,
} from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [aiQuery, setAiQuery] = useState('');

  const quickPrompts = [
    'List potential drug interactions',
    'Summarize patient history',
    'Compare recent lab results',
    'Identify elevated risk factors',
  ];

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
                  Live Sync
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                AI extraction models are monitoring new prescriptions and laboratory panels in real-time.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/patients')}
                className="text-xs"
              >
                <Users className="mr-1.5 h-3.5 w-3.5" />
                View Patients
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
              value="1,250"
              trend="+15.2%"
              trendUp={true}
              icon={Users}
              color="purple"
            />
            <StatCard
              label="Documents Processed"
              value="3,480"
              trend="-2.1%"
              trendUp={false}
              icon={FileCheck}
              color="blue"
            />
            <StatCard
              label="Pending Documents"
              value="145"
              trend="In Queue"
              trendUp={true}
              icon={Clock}
              color="amber"
            />
            <StatCard
              label="AI Copilot Queries"
              value="892"
              trend="+22.8%"
              trendUp={true}
              icon={Bot}
              color="mint"
            />
          </div>

          {/* Bento Grid: Documents Table + Processing Velocity + Clinora AI Assistant */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left 7 Columns: Recent Documents Table */}
            <Card className="lg:col-span-7 flex flex-col justify-between">
              <CardHeader className="flex flex-row items-center justify-between border-b border-white/[0.04] pb-4">
                <div>
                  <CardTitle className="text-sm font-bold text-white">Recent Clinical Documents</CardTitle>
                  <p className="text-xs text-slate-400">Recently uploaded medical charts and lab records</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/documents')}
                  className="h-7 text-xs"
                >
                  <Filter className="mr-1 h-3 w-3" />
                  View All
                </Button>
              </CardHeader>

              <CardContent className="p-0 flex-1">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-white/[0.06]">
                      <tr>
                        <th className="py-3 px-4">Document</th>
                        <th className="py-3 px-4">Patient</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {recentDocuments.slice(0, 5).map((doc) => (
                        <tr
                          key={doc.id}
                          className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                          onClick={() => navigate(`/documents/${doc.id}`, { state: { document: doc } })}
                        >
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-slate-200">{doc.name}</div>
                            <div className="text-[11px] text-slate-500">{doc.type}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-slate-300">{doc.patientName}</div>
                            <div className="font-mono text-[10px] text-slate-500">{doc.patientId}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge variant={doc.status === 'processed' ? 'mint' : 'amber'}>
                              {doc.status === 'processed' ? 'Processed' : 'Pending OCR'}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-slate-400">{doc.date}</td>
                          <td className="py-3.5 px-4 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-slate-400 hover:text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/documents/${doc.id}`, { state: { document: doc } });
                              }}
                            >
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Right 5 Columns: AI Copilot & Processing Activity */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* Clinora AI Copilot Card */}
              <Card className="border-brand-purple/20 bg-gradient-to-b from-brand-purple/[0.08] to-slate-900/60 shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-purple text-white shadow-md">
                        <Bot className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-sm font-bold text-white">Clinora Copilot</CardTitle>
                    </div>
                    <span className="rounded-full bg-brand-purple/20 px-2 py-0.5 text-[10px] font-bold text-brand-lavender border border-brand-purple/30">
                      RAG Active
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3.5">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Ask natural questions across authorized prescriptions, notes, and lab records:
                  </p>

                  {/* Quick Prompts */}
                  <div className="flex flex-wrap gap-1.5">
                    {quickPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => setAiQuery(prompt)}
                        className="rounded-lg border border-white/10 bg-slate-900/80 px-2.5 py-1 text-[11px] font-medium text-slate-300 transition-colors hover:border-brand-purple/50 hover:text-white hover:bg-slate-800"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>

                  {/* Prompt Input Box */}
                  <div className="relative mt-2">
                    <input
                      type="text"
                      placeholder="Ask Clinora about patient records..."
                      value={aiQuery}
                      onChange={(e) => setAiQuery(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-slate-950/80 pl-3.5 pr-20 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-brand-purple"
                    />
                    <div className="absolute right-1.5 top-1.5 flex items-center gap-1">
                      <button className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:text-slate-200">
                        <Mic className="h-3.5 w-3.5" />
                      </button>
                      <Button
                        size="sm"
                        variant="coral"
                        className="h-6 px-2 text-[11px]"
                        onClick={() => alert(`Copilot query: "${aiQuery}" will be processed in Phase 7 (RAG & AI Agent Workflow).`)}
                      >
                        <Send className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Processing Activity Velocity */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    <CardTitle className="text-xs font-bold text-white">Document Processing Activity</CardTitle>
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
