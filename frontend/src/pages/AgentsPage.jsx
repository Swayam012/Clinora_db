import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { currentUser } from '../services/mockData';
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
  Pill,
  Dna,
  Tag,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  Printer,
  ChevronRight,
  RefreshCw,
  Search,
  User,
  ShieldAlert,
  Flame,
  ArrowRight,
  ExternalLink,
  Code,
  Activity,
  Layers,
  HeartHandshake
} from 'lucide-react';

const AGENT_CONFIGS = {
  discharge_summary: {
    id: 'discharge_summary',
    name: 'Discharge Summary Synthesis',
    tagline: 'Autonomous Inpatient Summary & Care Transition Plan',
    icon: FileText,
    accent: 'purple',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    description: 'Synthesizes clinical timeline, active problems, diagnostic findings, inpatient course, and care plan into accredited discharge summaries.',
    tags: ['EHR Integration', 'Clinical Narrative', 'Care Transition'],
  },
  drug_interaction: {
    id: 'drug_interaction',
    name: 'Drug Safety & Interaction Auditor',
    tagline: 'Multi-Drug Contraindication & Adverse Reaction Matrix',
    icon: Pill,
    accent: 'coral',
    badgeColor: 'bg-coral-500/20 text-coral-300 border-coral-500/30',
    description: 'Cross-examines active prescriptions against allergies, renal/hepatic biomarkers, and pharmacodynamic contraindications.',
    tags: ['Pharmacology', 'Contraindications', 'Allergy Screen'],
  },
  clinical_trial: {
    id: 'clinical_trial',
    name: 'Precision Trial & Protocol Matcher',
    tagline: 'Genomic & Phenotypic Clinical Trial Eligibility Engine',
    icon: Dna,
    accent: 'blue',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    description: 'Matches patient diagnoses, biomarker profiles (e.g., EGFR, HbA1c), and clinical history against active trial registry criteria.',
    tags: ['ClinicalTrials.gov', 'Biomarkers', 'Inclusion Protocols'],
  },
  medical_coding: {
    id: 'medical_coding',
    name: 'ICD-10 & CPT Medical Coding Assistant',
    tagline: 'Automated Billing & Clinical Entity Mapping',
    icon: Tag,
    accent: 'mint',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    description: 'Extracts standardized ICD-10 diagnostic and CPT procedure billing codes from unstructured narrative with confidence scores.',
    tags: ['ICD-10-CM', 'CPT-4', 'Revenue Cycle'],
  },
};

export default function AgentsPage() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState('discharge_summary');
  const [customPrompt, setCustomPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [agentResult, setAgentResult] = useState(null);
  const [agentTypes, setAgentTypes] = useState([]);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('structured'); // 'structured' | 'raw'

  // Load Patients and Agent Metadata
  useEffect(() => {
    async function loadData() {
      try {
        const patientsRes = await getPatients(1, 50);
        if (patientsRes?.items && patientsRes.items.length > 0) {
          setPatients(patientsRes.items);
          setSelectedPatientId(patientsRes.items[0].id);
        } else {
          // Fallback mock patients
          const fallback = [
            { id: 'p1', full_name: 'Evelyn Carter', mrn: 'MRN-89214', date_of_birth: '1974-05-12', gender: 'Female' },
            { id: 'p2', full_name: 'Marcus Chen', mrn: 'MRN-44912', date_of_birth: '1982-11-23', gender: 'Male' },
            { id: 'p3', full_name: 'Emily Johnson', mrn: 'MRN-90231', date_of_birth: '1990-03-15', gender: 'Female' },
          ];
          setPatients(fallback);
          setSelectedPatientId(fallback[0].id);
        }
      } catch (err) {
        console.error('Failed to load patients for agent runner:', err);
      }

      try {
        const typesRes = await getAgentTypes();
        if (typesRes?.agents) {
          setAgentTypes(typesRes.agents);
        }
      } catch (err) {
        console.error('Failed to load agent types:', err);
      }
    }
    loadData();
  }, []);

  const handleRunAgent = async () => {
    if (!selectedPatientId || !selectedAgentId) return;
    setLoading(true);
    setAgentResult(null);

    try {
      const response = await runAgentTask({
        agentType: selectedAgentId,
        patientId: selectedPatientId,
        customPrompt: customPrompt.trim() || undefined,
      });
      setAgentResult(response);
    } catch (err) {
      setAgentResult({
        success: false,
        agent_type: selectedAgentId,
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
    const textToCopy = agentResult.summary || JSON.stringify(agentResult, null, 2);
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);
  const activeAgentConfig = AGENT_CONFIGS[selectedAgentId] || AGENT_CONFIGS.discharge_summary;
  const ActiveAgentIcon = activeAgentConfig.icon;

  const getRiskBadge = (risk) => {
    const r = (risk || 'Normal').toLowerCase();
    if (r === 'high' || r === 'critical') {
      return <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> High Risk</Badge>;
    }
    if (r === 'medium' || r === 'moderate') {
      return <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Medium Risk</Badge>;
    }
    if (r === 'low') {
      return <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Low Risk</Badge>;
    }
    return <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Normal</Badge>;
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      <Sidebar />

      <div className="flex flex-1 flex-col pl-64">
        <Topbar user={currentUser} />

        <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header Banner */}
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-950 p-6 backdrop-blur-xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-purple/20 border border-brand-purple/40 text-brand-lavender">
                    <Sparkles className="h-4 w-4 text-brand-coral animate-pulse" />
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-white">Clinical AI Agents Hub</h1>
                  <span className="rounded-full bg-brand-coral/20 px-2.5 py-0.5 text-xs font-semibold text-brand-coral border border-brand-coral/30">
                    Phase 9 Active
                  </span>
                </div>
                <p className="text-sm text-slate-400">
                  Autonomous task-oriented clinical agents for discharge synthesis, drug safety checks, clinical trial matching, and ICD-10/CPT coding.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/knowledge-graph')}
                  className="border-white/10 hover:bg-white/5 text-xs"
                >
                  <Layers className="h-3.5 w-3.5 mr-1.5 text-purple-400" />
                  Knowledge Graph
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/ai-tools')}
                  className="border-white/10 hover:bg-white/5 text-xs"
                >
                  <Bot className="h-3.5 w-3.5 mr-1.5 text-coral-400" />
                  RAG Assistant
                </Button>
              </div>
            </div>
          </div>

          {/* Agent Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.values(AGENT_CONFIGS).map((cfg) => {
              const Icon = cfg.icon;
              const isSelected = selectedAgentId === cfg.id;
              return (
                <div
                  key={cfg.id}
                  onClick={() => {
                    setSelectedAgentId(cfg.id);
                    setAgentResult(null);
                  }}
                  className={`relative cursor-pointer rounded-xl border p-4 transition-all duration-200 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-purple-950/30 border-purple-500/50 shadow-lg shadow-purple-950/50 ring-1 ring-purple-500/40'
                      : 'bg-slate-900/60 border-white/[0.08] hover:bg-slate-900 hover:border-white/20'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${cfg.badgeColor}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      {isSelected && (
                        <span className="flex h-2 w-2 rounded-full bg-brand-coral animate-ping" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white tracking-tight">{cfg.name}</h3>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {cfg.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-1">
                    {cfg.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-medium text-slate-400 border border-white/5"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
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
                          {p.full_name} ({p.mrn || 'MRN-N/A'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedPatient && (
                    <div className="rounded-lg bg-slate-950/70 border border-white/5 p-3 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">MRN:</span>
                        <span className="font-mono font-medium text-purple-300">{selectedPatient.mrn || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">DOB:</span>
                        <span className="text-slate-200">{selectedPatient.date_of_birth || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Gender:</span>
                        <span className="text-slate-200">{selectedPatient.gender || 'N/A'}</span>
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
                      placeholder="e.g. Focus on cardiology follow-up plan, or highlight renal dosage adjustments..."
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
                        Running Agent Orchestrator...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Execute {activeAgentConfig.name}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Agent Capability Specs */}
              <Card className="border-white/[0.08] bg-slate-900/40 backdrop-blur-xl">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                    <ActiveAgentIcon className="h-4 w-4 text-purple-400" />
                    <span>Agent Architecture</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {activeAgentConfig.tagline}
                  </p>
                  <div className="border-t border-white/5 pt-2 flex items-center justify-between text-[10px] text-slate-500">
                    <span>Protocol Engine v2.4</span>
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
                    <ActiveAgentIcon className="h-4 w-4 text-brand-lavender" />
                    <CardTitle className="text-sm font-semibold text-white">
                      {activeAgentConfig.name} Output
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
                        <Bot className="h-6 w-6" />
                      </div>
                      <div className="space-y-1 max-w-sm">
                        <h4 className="text-sm font-medium text-white">Ready for Orchestration</h4>
                        <p className="text-xs text-slate-400">
                          Select a patient and click <strong className="text-purple-300">Execute {activeAgentConfig.name}</strong> to synthesize clinical data and generate actionable guidance.
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
                        <h4 className="text-sm font-medium text-white">Agent Multi-Step Inference Active</h4>
                        <p className="text-xs text-slate-400 max-w-xs">
                          Extracting EHR records, validating biomedical knowledge graph constraints, and synthesizing structured report...
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
                    <div className="space-y-6">
                      {/* Summary Banner */}
                      <div className="rounded-xl border border-white/[0.08] bg-slate-950/60 p-4 space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-purple-300">
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-brand-coral" /> Executive Clinical Synthesis
                          </span>
                          <span className="text-slate-400 font-normal">Patient: {agentResult.patient_id}</span>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                          {agentResult.summary}
                        </p>
                      </div>

                      {/* Agent Type Specific Renders */}
                      {/* 1. Drug Interaction Output */}
                      {agentResult.agent_type === 'drug_interaction' && agentResult.interactions && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <Pill className="h-3.5 w-3.5 text-coral-400" /> Identified Drug Interactions & Warnings ({agentResult.interactions.length})
                          </h4>
                          <div className="space-y-2.5">
                            {agentResult.interactions.length === 0 ? (
                              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-300 flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4" /> No severe drug-drug contraindications detected in current active regimen.
                              </div>
                            ) : (
                              agentResult.interactions.map((item, idx) => (
                                <div key={idx} className="rounded-lg border border-white/10 bg-slate-950/70 p-3.5 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-xs text-white">{item.drug1}</span>
                                      <span className="text-slate-500 text-xs font-mono">↔</span>
                                      <span className="font-semibold text-xs text-white">{item.drug2}</span>
                                    </div>
                                    <Badge className={
                                      item.severity === 'Severe' || item.severity === 'High'
                                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                    }>
                                      {item.severity} Severity
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-slate-300">{item.description}</p>
                                  {item.recommendation && (
                                    <div className="rounded bg-white/5 p-2 text-[11px] text-brand-lavender border border-white/5 flex items-start gap-1.5">
                                      <AlertCircle className="h-3.5 w-3.5 mt-0.5 text-brand-coral shrink-0" />
                                      <span><strong>Action:</strong> {item.recommendation}</span>
                                    </div>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}

                      {/* 2. Clinical Trial Match Output */}
                      {agentResult.agent_type === 'clinical_trial' && agentResult.trial_matches && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <Dna className="h-3.5 w-3.5 text-blue-400" /> Matched Clinical Protocols ({agentResult.trial_matches.length})
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {agentResult.trial_matches.map((trial, idx) => (
                              <div key={idx} className="rounded-lg border border-white/10 bg-slate-950/70 p-3.5 space-y-2.5 flex flex-col justify-between">
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-mono text-purple-400 font-semibold">{trial.nct_id}</span>
                                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-[10px]">
                                      {trial.phase || 'Phase II/III'}
                                    </Badge>
                                  </div>
                                  <h5 className="text-xs font-semibold text-white leading-snug">{trial.title}</h5>
                                  <p className="text-[11px] text-slate-400">{trial.match_reason}</p>
                                </div>

                                <div className="space-y-2 pt-2 border-t border-white/5">
                                  <div className="flex justify-between items-center text-[10px]">
                                    <span className="text-slate-400">Match Score:</span>
                                    <span className="font-bold text-emerald-400">{Math.round((trial.score || 0.85) * 100)}%</span>
                                  </div>
                                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className="bg-gradient-to-r from-purple-500 to-emerald-400 h-1.5 rounded-full"
                                      style={{ width: `${Math.round((trial.score || 0.85) * 100)}%` }}
                                    />
                                  </div>
                                  {trial.criteria && trial.criteria.length > 0 && (
                                    <div className="flex flex-wrap gap-1 pt-1">
                                      {trial.criteria.slice(0, 3).map((c, cIdx) => (
                                        <span key={cIdx} className="rounded bg-purple-500/10 px-1.5 py-0.5 text-[9px] text-purple-300 border border-purple-500/20">
                                          ✓ {c}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 3. Medical Coding Output */}
                      {agentResult.agent_type === 'medical_coding' && agentResult.codes && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <Tag className="h-3.5 w-3.5 text-emerald-400" /> Extracted ICD-10 & CPT Medical Codes ({agentResult.codes.length})
                          </h4>
                          <div className="rounded-lg border border-white/10 overflow-hidden">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-white/10">
                                <tr>
                                  <th className="p-2.5">Code</th>
                                  <th className="p-2.5">Type</th>
                                  <th className="p-2.5">Clinical Term</th>
                                  <th className="p-2.5">Confidence</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5 bg-slate-950/40">
                                {agentResult.codes.map((c, idx) => (
                                  <tr key={idx} className="hover:bg-white/[0.02]">
                                    <td className="p-2.5 font-mono font-bold text-purple-300">{c.code}</td>
                                    <td className="p-2.5">
                                      <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">
                                        {c.code_type || 'ICD-10'}
                                      </span>
                                    </td>
                                    <td className="p-2.5 text-slate-200">{c.description}</td>
                                    <td className="p-2.5">
                                      <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">
                                        {Math.round((c.confidence || 0.95) * 100)}%
                                      </Badge>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* General Recommendations Section */}
                      {agentResult.recommendations && agentResult.recommendations.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-white/10">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-purple-400" /> Actionable Clinical Recommendations
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
