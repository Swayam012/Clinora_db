import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  getPatients,
  getAgentTypes,
  runAgentTask,
} from '../services/api';
import {
  Bot,
  Sparkles,
  FileText,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  Printer,
  User,
  ExternalLink,
  ClipboardList,
  Layers,
  Activity,
} from 'lucide-react';

const AGENT_CONFIG = {
  id: 'discharge_summary',
  name: 'Discharge Summary Synthesis',
  tagline: 'Autonomous Inpatient Summary & Care Transition Plan',
  icon: ClipboardList,
  accent: 'purple',
  badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  description: 'Synthesizes clinical timeline, active problems, diagnostic findings, inpatient course, and care plan into accredited discharge summaries.',
  tags: ['EHR Integration', 'Clinical Narrative', 'Care Transition'],
};

export default function AgentsPage() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    import('../services/api').then((m) => m.getCurrentUser().then((u) => u && setUser(u)).catch(() => {}));
  }, []);
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [agentResult, setAgentResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('structured'); // 'structured' | 'raw'

  // Load Patients
  useEffect(() => {
    async function loadData() {
      try {
        const patientsRes = await getPatients(1, 100);
        const pts = patientsRes?.patients || patientsRes?.items || [];
        if (pts.length > 0) {
          setPatients(pts);
          setSelectedPatientId(pts[0].id);
        } else {
          setPatients([]);
          setSelectedPatientId('');
        }
      } catch (err) {
        console.error('Failed to load patients for agent runner:', err);
      }
    }
    loadData();
  }, []);

  const handleRunAgent = async () => {
    if (!selectedPatientId) return;
    setLoading(true);
    setAgentResult(null);

    try {
      const response = await runAgentTask({
        agentType: 'discharge_summary',
        patientId: selectedPatientId,
        customPrompt: customPrompt.trim() || undefined,
      });
      setAgentResult(response);
    } catch (err) {
      setAgentResult({
        success: false,
        agent_type: 'discharge_summary',
        patient_id: selectedPatientId,
        summary: `Execution Error: ${err.message}`,
        risk_level: 'High',
        recommendations: ['Please verify backend connectivity and patient record validity.'],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!agentResult) return;
    const textToCopy = agentResult.executive_summary || agentResult.summary || JSON.stringify(agentResult, null, 2);
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);
  const AgentIcon = AGENT_CONFIG.icon;

  const getRiskBadge = (risk) => {
    const r = (risk || 'Normal').toLowerCase();
    if (r === 'high' || r === 'critical') {
      return (
        <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" /> High Risk
        </Badge>
      );
    }
    if (r === 'medium' || r === 'moderate') {
      return (
        <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" /> Medium Risk
        </Badge>
      );
    }
    if (r === 'low') {
      return (
        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" /> Low Risk
        </Badge>
      );
    }
    return (
      <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 flex items-center gap-1">
        <CheckCircle2 className="h-3 w-3" /> Normal
      </Badge>
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      <Sidebar />

      <div className="flex flex-1 flex-col pl-64">
        <Topbar user={user} />

        <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header Banner */}
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-950 p-6 backdrop-blur-xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-purple/20 border border-brand-purple/40 text-brand-lavender">
                    <ClipboardList className="h-4 w-4 text-brand-coral" />
                  </div>
                  <h1 className="text-xl font-bold tracking-tight text-white">Discharge Summary Synthesis Agent</h1>
                </div>
                <p className="text-xs text-slate-400">
                  Autonomous clinical agent for synthesizing longitudinal EHR records, lab trends, and care transition plans into standardized hospital discharge briefs.
                </p>
              </div>
            </div>
          </div>

          {/* Active Agent Overview Card */}
          <div className="relative rounded-xl border border-purple-500/40 bg-purple-950/20 p-5 shadow-lg shadow-purple-950/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${AGENT_CONFIG.badgeColor} shrink-0`}>
                  <AgentIcon className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white tracking-tight">{AGENT_CONFIG.name}</h3>
                    <Badge variant="purple" className="text-[10px]">Active Agent</Badge>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-3xl">
                    {AGENT_CONFIG.description}
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {AGENT_CONFIG.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="rounded bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-400 border border-white/5"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Execution Workspace & Parameters */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col: Target Patient & Parameters */}
            <div className="space-y-4 lg:col-span-1">
              <Card className="border-white/[0.08] bg-slate-900/80 backdrop-blur-xl">
                <CardHeader className="pb-3 border-b border-white/[0.06]">
                  <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                    <User className="h-4 w-4 text-purple-400" />
                    Patient Context
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div>
                    <label className="text-xs font-medium text-slate-400 block mb-1.5">
                      Select Patient Record
                    </label>
                    <select
                      value={selectedPatientId}
                      onChange={(e) => {
                        setSelectedPatientId(e.target.value);
                        setAgentResult(null);
                      }}
                      className="w-full rounded-lg bg-slate-950 border border-white/10 px-3 py-2 text-xs text-white focus:border-purple-500/50 focus:outline-none"
                    >
                      {patients.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.first_name ? `${p.first_name} ${p.last_name}` : p.full_name} ({p.patient_id || p.mrn || 'N/A'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedPatient && (
                    <div className="rounded-lg bg-slate-950/70 border border-white/5 p-3 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Patient ID:</span>
                        <span className="font-mono font-medium text-purple-300">{selectedPatient.patient_id || selectedPatient.mrn || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">DOB:</span>
                        <span className="text-slate-200">{selectedPatient.date_of_birth || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Gender:</span>
                        <span className="text-slate-200 capitalize">{selectedPatient.gender || 'N/A'}</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-medium text-slate-400 block mb-1.5">
                      Custom Clinical Instructions (Optional)
                    </label>
                    <textarea
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="e.g. Focus on cardiology follow-up plan, or highlight post-discharge monitoring..."
                      rows={3}
                      className="w-full rounded-lg bg-slate-950 border border-white/10 p-2.5 text-xs text-white placeholder-slate-500 focus:border-purple-500/50 focus:outline-none resize-none"
                    />
                  </div>

                  <Button
                    onClick={handleRunAgent}
                    disabled={loading || !selectedPatientId}
                    className="w-full bg-gradient-to-r from-purple-600 to-brand-coral hover:from-purple-500 hover:to-brand-coral/90 text-white font-medium text-xs py-2.5 shadow-lg shadow-purple-900/30 transition-all"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Running Synthesis Agent...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Execute Discharge Summary
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Agent Information Card */}
              <Card className="border-white/[0.08] bg-slate-900/60">
                <CardContent className="p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-medium text-purple-300">
                    <AgentIcon className="h-4 w-4" />
                    <span>Discharge Brief Specifications</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {AGENT_CONFIG.tagline}
                  </p>
                  <div className="border-t border-white/5 pt-2 flex items-center justify-between text-[10px] text-slate-500">
                    <span>Clinical Synthesis Engine</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-2.5 w-2.5" /> HIPAA Guard Active
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Col: Agent Results & Structured Report */}
            <div className="space-y-4 lg:col-span-2">
              <Card className="border-white/[0.08] bg-slate-900/80 backdrop-blur-xl min-h-[500px] flex flex-col">
                <CardHeader className="pb-3 border-b border-white/[0.06] flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AgentIcon className="h-4 w-4 text-brand-lavender" />
                    <CardTitle className="text-sm font-semibold text-white">
                      Discharge Summary Brief Output
                    </CardTitle>
                    {agentResult && getRiskBadge(agentResult.risk_level)}
                  </div>

                  {agentResult && (
                    <div className="flex items-center gap-1.5">
                      <div className="flex rounded-lg bg-slate-950 p-0.5 border border-white/10 mr-2">
                        <button
                          onClick={() => setActiveTab('structured')}
                          className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                            activeTab === 'structured' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Structured View
                        </button>
                        <button
                          onClick={() => setActiveTab('raw')}
                          className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                            activeTab === 'raw' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Raw JSON
                        </button>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopy}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                        title="Copy Summary"
                      >
                        {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handlePrint}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                        title="Print Report"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardHeader>

                <CardContent className="pt-4 flex-1 flex flex-col justify-start">
                  {!agentResult && !loading && (
                    <div className="flex flex-1 flex-col items-center justify-center py-16 text-center space-y-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-950/50 border border-purple-500/20 text-purple-400">
                        <ClipboardList className="h-6 w-6" />
                      </div>
                      <div className="space-y-1 max-w-sm">
                        <h4 className="text-sm font-medium text-white">Ready for Synthesis</h4>
                        <p className="text-xs text-slate-400">
                          Select a patient and click <strong className="text-purple-300">Execute Discharge Summary</strong> to synthesize clinical history, active problems, and follow-up guidance.
                        </p>
                      </div>
                    </div>
                  )}

                  {loading && (
                    <div className="flex flex-1 flex-col items-center justify-center py-16 text-center space-y-4">
                      <div className="relative">
                        <div className="h-12 w-12 rounded-full border-2 border-purple-500/20 border-t-purple-500 animate-spin" />
                        <Sparkles className="h-5 w-5 text-brand-coral absolute top-3.5 left-3.5 animate-pulse" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium text-white">Synthesizing Longitudinal Records</h4>
                        <p className="text-xs text-slate-400 max-w-xs">
                          Extracting EHR extractions, reconciling active medications, and formulating discharge handover plan...
                        </p>
                      </div>
                    </div>
                  )}

                  {agentResult && activeTab === 'raw' && (
                    <div className="rounded-lg bg-slate-950 p-4 border border-white/5 font-mono text-[11px] text-slate-300 overflow-auto max-h-[550px]">
                      <pre>{JSON.stringify(agentResult, null, 2)}</pre>
                    </div>
                  )}

                  {agentResult && activeTab === 'structured' && (
                    <div className="space-y-5">
                      {/* Summary Banner */}
                      <div className="rounded-xl border border-white/[0.08] bg-slate-950/60 p-4 space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-purple-300">
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-brand-coral" /> Executive Clinical Synthesis
                          </span>
                          <span className="text-slate-400 font-normal">Patient: {agentResult.patient_name || agentResult.patient_id}</span>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                          {agentResult.executive_summary || agentResult.summary}
                        </p>
                      </div>

                      {/* Key Findings */}
                      {agentResult.key_findings && agentResult.key_findings.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <Activity className="h-3.5 w-3.5 text-brand-lavender" /> Key Clinical Findings & Regimen
                          </h4>
                          <ul className="space-y-1.5">
                            {agentResult.key_findings.map((item, idx) => (
                              <li key={idx} className="rounded-lg bg-slate-950/60 border border-white/5 p-2.5 text-xs text-slate-300 flex items-start gap-2">
                                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-purple-500/20 text-[10px] text-purple-300 font-bold shrink-0 mt-0.5">
                                  {idx + 1}
                                </span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* General Recommendations Section */}
                      {agentResult.recommendations && agentResult.recommendations.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-white/10">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-purple-400" /> Care Transition & Follow-Up Recommendations
                          </h4>
                          <ul className="space-y-1.5">
                            {agentResult.recommendations.map((rec, idx) => (
                              <li key={idx} className="rounded-lg bg-purple-950/20 border border-purple-500/20 p-2.5 text-xs text-slate-200 flex items-start gap-2">
                                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-purple-500/20 text-[10px] text-purple-300 font-bold shrink-0 mt-0.5">
                                  {idx + 1}
                                </span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Grounding Citations */}
                      {agentResult.citations && agentResult.citations.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-white/10">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <Layers className="h-3.5 w-3.5 text-blue-400" /> Evidence Citations & Ingested Charts
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {agentResult.citations.map((c, idx) => (
                              <span key={idx} className="rounded-md bg-white/5 border border-white/10 px-2.5 py-1 text-[11px] text-slate-300">
                                📄 {c.title || c.name || 'Clinical Document'}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
