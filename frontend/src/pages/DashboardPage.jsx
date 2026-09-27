import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import { StatCard } from '../components/ui/stat-card';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  getAnalyticsSummary,
  getDocuments,
  getCurrentUser,
} from '../services/api';
import {
  Users,
  FileText,
  Clock,
  Bot,
  FileCheck,
  ArrowRight,
  Filter,
} from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [liveStats, setLiveStats] = useState(null);
  const [recentDocs, setRecentDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const userData = await getCurrentUser();
        if (userData) setUser(userData);
      } catch (err) {
        console.debug('Failed to load current user:', err);
      }

      try {
        const stats = await getAnalyticsSummary();
        setLiveStats(stats);
      } catch (err) {
        console.debug('Failed to load live stats for dashboard:', err);
      }

      try {
        const docsRes = await getDocuments({ perPage: 10 });
        if (docsRes?.items && docsRes.items.length > 0) {
          setRecentDocs(docsRes.items);
        } else {
          setRecentDocs([]);
        }
      } catch (err) {
        console.debug('Failed to load recent documents:', err);
        setRecentDocs([]);
      } finally {
        setDocsLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Sidebar />

      <div className="flex flex-1 flex-col ml-64 min-w-0">
        <Topbar user={user} />

        <main className="flex-1 space-y-6 p-8 max-w-7xl mx-auto w-full">
          {/* Top Header Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Clinical Operations Overview</h1>
              <p className="mt-1 text-xs text-slate-400">
                Active patient telemetry and document ingestion status.
              </p>
            </div>

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

          {/* 4 Stat Cards Row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Patients"
              value={liveStats ? liveStats.total_patients.toLocaleString() : '0'}
              trend={liveStats ? `${liveStats.total_patients} Active` : '0 Active'}
              trendUp={true}
              icon={Users}
              color="purple"
            />
            <StatCard
              label="Documents Processed"
              value={liveStats ? liveStats.processed_documents.toLocaleString() : '0'}
              trend={liveStats ? `${liveStats.ocr_success_rate}% Accuracy` : '100% Accuracy'}
              trendUp={true}
              icon={FileCheck}
              color="blue"
            />
            <StatCard
              label="Pending Documents"
              value={liveStats ? liveStats.pending_documents.toLocaleString() : '0'}
              trend="Queue Active"
              trendUp={true}
              icon={Clock}
              color="amber"
            />
            <StatCard
              label="AI Queries Answered"
              value={liveStats ? liveStats.rag_queries_answered.toLocaleString() : '0'}
              trend="RAG Grounded"
              trendUp={true}
              icon={Bot}
              color="mint"
            />
          </div>

          {/* Full Width Recent Clinical Documents Table */}
          <Card className="border-white/[0.08] bg-slate-900/80 backdrop-blur-xl">
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
                View All Documents
              </Button>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-white/[0.06]">
                    <tr>
                      <th className="py-3 px-6">Document</th>
                      <th className="py-3 px-6">Document Type</th>
                      <th className="py-3 px-6">Status</th>
                      <th className="py-3 px-6">Uploaded Date</th>
                      <th className="py-3 px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {recentDocs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500">
                          No clinical documents ingested yet. Upload a document to view processing telemetry.
                        </td>
                      </tr>
                    ) : (
                      recentDocs.map((doc) => (
                        <tr
                          key={doc.id}
                          className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                          onClick={() => navigate(`/documents/${doc.id}`)}
                        >
                          <td className="py-4 px-6">
                            <div className="font-semibold text-slate-200">
                              {doc.title || doc.name || doc.original_filename}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">{doc.id.slice(0, 16)}...</div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="rounded bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-300 border border-white/5">
                              {(doc.document_type || doc.type || 'Clinical Note').replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <Badge
                              variant={doc.status === 'processed' ? 'mint' : doc.status === 'processing' ? 'purple' : 'amber'}
                              className="text-[10px] capitalize"
                            >
                              {doc.status || 'processed'}
                            </Badge>
                          </td>
                          <td className="py-4 px-6 text-slate-400 font-mono text-[11px]">
                            {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : (doc.date || 'Today')}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <span className="text-xs font-semibold text-brand-lavender hover:text-white transition-colors">
                              Open Viewer →
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
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
        </main>
      </div>
    </div>
  );
}
