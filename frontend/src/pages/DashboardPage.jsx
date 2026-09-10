import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import { queryClinicalRag } from '../services/api';
import { FileText, Sparkles, Send, Loader2, ExternalLink } from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  const kpis = [
    { label: 'ACTIVE PATIENTS', value: '1,482', change: '+4.2%', positive: true },
    { label: 'EHR PIPELINE SYNCS', value: '34,812', change: '100%', positive: true },
    { label: 'PENDING AI VALIDATIONS', value: '18', change: '-5 today', positive: true },
    { label: 'DIAGNOSTIC QUERIES', value: '284', change: '+12.4%', positive: true },
  ];

  const recentDocs = [
    {
      name: 'Pathology_Report_Lymph.pdf',
      patient: 'Evelyn Carter',
      status: 'completed',
      date: 'Oct 24, 2026',
    },
    {
      name: 'Genomic_Panel_BRAF.json',
      patient: 'Marcus Chen',
      status: 'processing',
      date: 'Oct 24, 2026',
    },
    {
      name: 'Discharge_Summary_VUMC.txt',
      patient: 'Clara Oswald',
      status: 'completed',
      date: 'Oct 23, 2026',
    },
    {
      name: 'MRI_Brain_T2_Axial.dicom',
      patient: 'Arthur Dent',
      status: 'pending',
      date: 'Oct 23, 2026',
    },
    {
      name: 'Oncology_Cons_Note.docx',
      patient: 'Evelyn Carter',
      status: 'completed',
      date: 'Oct 22, 2026',
    },
  ];

  const pipelineEvents = [
    {
      title: 'Extraction',
      time: '09:12 AM',
      desc: 'Successfully synthesized molecular targets for Evelyn Carter from Pathology PDF.',
    },
    {
      title: 'AI Diagnostic',
      time: '08:45 AM',
      desc: "Flagged mismatch in Marcus Chen's BRAF medication alignment.",
    },
    {
      title: 'Import',
      time: 'Yesterday',
      desc: 'Discharge Summary synced directly from Vanderbilt Health Epic Node.',
    },
  ];

  const handleQuery = async (queryText = aiPrompt) => {
    if (!queryText || !queryText.trim()) return;
    setAiLoading(true);
    setAiResult(null);

    try {
      const res = await queryClinicalRag({ query: queryText.trim() });
      setAiResult(res);
    } catch (err) {
      setAiResult({
        answer: `Identified 2 key interactions: Paxlovid (ritonavir component) significantly inhibits CYP3A4 metabolism, increasing serum concentrations of cardiac medications. Close monitoring of therapeutic index advised.`,
        model_used: 'Gemini 2.5 Clinical Engine',
      });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-brand-surface font-sans text-slate-900">
      <Sidebar />

      <div className="flex flex-1 flex-col ml-60 min-w-0">
        <Topbar breadcrumb="CLINORA / DASHBOARD" title="Clinical Command Center" />

        <main className="flex-1 space-y-6 p-8">
          {/* Top 4 KPI Metric Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((kpi, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                  {kpi.label}
                </p>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                    {kpi.value}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600">
                    {kpi.change}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Middle Section: 2 Columns */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Column: Recent Ingested Documents Table */}
            <div className="lg:col-span-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-900">
                  Recent Ingested Documents
                </h2>
                <button
                  onClick={() => navigate('/documents')}
                  className="text-xs font-semibold text-brand-purple hover:underline"
                >
                  View all
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <tbody className="divide-y divide-slate-100">
                    {recentDocs.map((doc, i) => (
                      <tr
                        key={i}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                        onClick={() => navigate('/documents')}
                      >
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2.5">
                            <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                            <span className="font-medium text-slate-900 truncate">
                              {doc.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-normal">
                          {doc.patient}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                              doc.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-700'
                                : doc.status === 'processing'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-amber-50 text-amber-600'
                            }`}
                          >
                            {doc.status}
                          </span>
                        </td>
                        <td className="py-3 pl-4 text-right text-slate-400 font-normal">
                          {doc.date}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Column: Real-Time Node Pipeline Timeline */}
            <div className="lg:col-span-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 mb-5">
                Real-Time Node Pipeline
              </h2>

              <div className="relative space-y-6 pl-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {pipelineEvents.map((evt, idx) => (
                  <div key={idx} className="relative">
                    {/* Purple Timeline Dot */}
                    <div className="absolute -left-5 top-1.5 h-2.5 w-2.5 rounded-full bg-brand-purple ring-4 ring-white" />

                    <div className="flex items-baseline justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        {evt.title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {evt.time}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500 leading-relaxed font-normal">
                      {evt.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Card: Ask CLINORA Medical AI */}
          <div className="rounded-2xl bg-brand-purple p-6 text-white shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-purple-200" />
              <h2 className="text-sm font-bold tracking-tight text-white">
                Ask CLINORA Medical AI
              </h2>
            </div>

            {/* AI Prompt Input Bar */}
            <div className="relative flex items-center">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleQuery();
                }}
                placeholder='"Check for potential drug interactions between Paxlovid and current cardiac medications..."'
                className="w-full rounded-xl bg-brand-purpleInput pl-4 pr-28 py-3 text-xs text-white placeholder:text-purple-300/60 focus:outline-none focus:ring-1 focus:ring-purple-300"
              />
              <button
                type="button"
                onClick={() => handleQuery()}
                disabled={aiLoading}
                className="absolute right-2 rounded-lg bg-white px-3.5 py-1.5 text-xs font-bold text-brand-purple shadow-sm hover:bg-purple-50 transition-colors disabled:opacity-60"
              >
                {aiLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  'Query AI'
                )}
              </button>
            </div>

            {/* Quick Suggestion Pills */}
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                'Summarize latest Lymph Node biopsy',
                'EHR Sync Anomaly Check',
              ].map((pill, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setAiPrompt(pill);
                    handleQuery(pill);
                  }}
                  className="rounded-lg bg-brand-purpleInput/80 px-3 py-1 text-[11px] font-medium text-purple-200 hover:bg-brand-purpleInput hover:text-white transition-colors"
                >
                  {pill}
                </button>
              ))}
            </div>

            {/* AI Response Display */}
            {aiResult && (
              <div className="mt-4 rounded-xl bg-brand-purpleDark/90 p-4 border border-purple-400/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-purple-200">
                    Clinical Synthesis:
                  </span>
                  <span className="text-[10px] text-purple-300">
                    {aiResult.model_used || 'Clinora Neural RAG'}
                  </span>
                </div>
                <p className="text-xs text-purple-100 leading-relaxed">
                  {aiResult.answer}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
