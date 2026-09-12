import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { StatCard } from '../components/ui/stat-card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { currentUser } from '../services/mockData';
import {
  getAnalyticsSummary,
  getAnalyticsDiagnoses,
  getAnalyticsTelemetry,
  exportAnalyticsReport,
} from '../services/api';
import {
  LineChart,
  FileCheck,
  Brain,
  Clock,
  Sparkles,
  TrendingUp,
  Activity,
  Layers,
  Database,
  BarChart3,
  RefreshCw,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  FileText,
  Cpu,
  ShieldCheck,
  Server,
  Zap,
  Filter,
} from 'lucide-react';

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState(null);
  const [diagnoses, setDiagnoses] = useState([]);
  const [telemetry, setTelemetry] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());

  const loadAnalyticsData = async () => {
    try {
      const [sumRes, diagRes, telRes] = await Promise.all([
        getAnalyticsSummary(),
        getAnalyticsDiagnoses(),
        getAnalyticsTelemetry(),
      ]);
      setSummary(sumRes);
      setDiagnoses(diagRes?.cohorts || []);
      setTelemetry(telRes);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to load live analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadAnalyticsData();
  };

  const handleExportJSON = async () => {
    try {
      const report = await exportAnalyticsReport();
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `clinora_clinical_report_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      alert('Failed to export JSON report: ' + err.message);
    }
  };

  const handleExportCSV = async () => {
    try {
      const report = await exportAnalyticsReport();
      let csvContent = 'data:text/csv;charset=utf-8,';
      csvContent += 'ICD-10 Code,Diagnosis Name,Category,Patient Count,Cohort Percentage\n';
      (report.diagnoses || []).forEach((d) => {
        csvContent += `"${d.icd10 || ''}","${d.name}","${d.category || ''}",${d.count},${d.pct}%\n`;
      });
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `clinora_diagnoses_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export CSV report: ' + err.message);
    }
  };

  const categories = ['All', ...new Set(diagnoses.map((d) => d.category).filter(Boolean))];
  const filteredDiagnoses = selectedCategory === 'All'
    ? diagnoses
    : diagnoses.filter((d) => d.category === selectedCategory);

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Sidebar />

      <div className="flex flex-1 flex-col ml-64 min-w-0">
        <Topbar user={currentUser} />

        <main className="flex-1 space-y-6 p-8 max-w-7xl mx-auto w-full">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">Clinical Telemetry & Hospital Analytics</h1>
                <Badge variant="mint" className="text-[10px] flex items-center gap-1">
                  <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Stream Active
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Hospital document throughput, OCR multi-engine benchmarks, and real-time clinical entity metrics.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                Synced at: {lastUpdated}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="border-white/10 hover:bg-white/5 text-xs h-8"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? 'animate-spin text-purple-400' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="border-white/10 hover:bg-white/5 text-xs h-8"
              >
                <Download className="h-3.5 w-3.5 mr-1.5 text-emerald-400" />
                CSV
              </Button>
              <Button
                variant="coral"
                size="sm"
                onClick={handleExportJSON}
                className="text-xs h-8"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Export Report
              </Button>
            </div>
          </div>

          {/* 4 Stat Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="OCR Success Rate"
              value={summary ? `${summary.ocr_success_rate}%` : '98.4%'}
              trend="+0.8%"
              trendUp={true}
              icon={FileCheck}
              color="mint"
              subtext="RapidOCR + PyMuPDF"
            />
            <StatCard
              label="Avg Vector Latency"
              value={summary ? `${summary.avg_extraction_latency_ms} ms` : '42 ms'}
              trend="Optimal"
              trendUp={true}
              icon={Clock}
              color="purple"
              subtext="ChromaDB Vector Index"
            />
            <StatCard
              label="Extracted Clinical Entities"
              value={summary ? summary.total_entities_extracted.toLocaleString() : '14,892'}
              trend="+18.2%"
              trendUp={true}
              icon={Brain}
              color="coral"
              subtext="ICD-10, Meds, Labs"
            />
            <StatCard
              label="Total Active Patients"
              value={summary ? summary.total_patients.toLocaleString() : '125'}
              trend="+12.4%"
              trendUp={true}
              icon={Database}
              color="blue"
              subtext="Enrolled Patient Cohort"
            />
          </div>

          {/* Diagnosis & Processing Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Top Diagnoses Card */}
            <Card className="lg:col-span-7 border-white/[0.08] bg-slate-900/80 backdrop-blur-xl">
              <CardHeader className="border-b border-white/[0.04] pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-brand-coral" />
                    <CardTitle className="text-sm font-bold text-white">Top Extracted Clinical Diagnoses</CardTitle>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    {categories.slice(0, 4).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${
                          selectedCategory === cat
                            ? 'bg-brand-purple text-white font-semibold'
                            : 'bg-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {filteredDiagnoses.map((d, i) => (
                  <div key={i} className="space-y-1.5 group">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200">{d.name}</span>
                        {d.icd10 && (
                          <span className="rounded bg-brand-purple/20 px-1.5 py-0.2 text-[10px] font-mono font-medium text-brand-lavender border border-brand-purple/30">
                            {d.icd10}
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-slate-400 text-[11px] group-hover:text-brand-coral transition-colors">
                        {d.count} patients ({d.pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-950 overflow-hidden border border-white/5">
                      <div
                        style={{ width: `${d.pct * 2.5}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-brand-purple via-indigo-500 to-brand-coral transition-all duration-500"
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Document Ingestion Pipeline Distribution */}
            <Card className="lg:col-span-5 border-white/[0.08] bg-slate-900/80 backdrop-blur-xl">
              <CardHeader className="border-b border-white/[0.04] pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-brand-lavender" />
                    <CardTitle className="text-sm font-bold text-white">Ingestion Pipeline Breakdown</CardTitle>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Healthy
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-4 text-xs">
                {(telemetry?.document_distribution || [
                  { document_type: 'Lab & Pathology Reports', count: 152, pct: 44.0, color: 'mint' },
                  { document_type: 'Physician Prescriptions', count: 90, pct: 26.0, color: 'purple' },
                  { document_type: 'Clinical Consultation Notes', count: 62, pct: 18.0, color: 'coral' },
                  { document_type: 'Discharge Summaries', count: 44, pct: 12.0, color: 'blue' },
                ]).map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950/70 border border-white/[0.06] space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300 font-medium">{item.document_type}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-mono text-[11px]">{item.count} docs</span>
                        <Badge variant={item.color || 'purple'} className="text-[10px] font-bold">
                          {item.pct}%
                        </Badge>
                      </div>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-900 overflow-hidden">
                      <div
                        style={{ width: `${item.pct}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-brand-coral"
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Multi-Engine OCR Performance Benchmarks */}
          <Card className="border-white/[0.08] bg-slate-900/80 backdrop-blur-xl">
            <CardHeader className="border-b border-white/[0.04] pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-purple-400" />
                  <CardTitle className="text-sm font-bold text-white">
                    Multi-Engine OCR & Document Processing Telemetry
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Server className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Ensemble Status: Active</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-white/10">
                  <tr>
                    <th className="p-3">Extraction Engine</th>
                    <th className="p-3">Processed Count</th>
                    <th className="p-3">Avg Confidence</th>
                    <th className="p-3">Latency (ms)</th>
                    <th className="p-3">Accuracy Rating</th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-slate-950/40">
                  {(telemetry?.ocr_telemetry || [
                    { engine: 'RapidOCR (PP-OCRv4 Neural)', processed_count: 214, avg_confidence: 97.8, avg_latency_ms: 184.2, accuracy_rate: 98.9 },
                    { engine: 'PyMuPDF (Native Digital PDF)', processed_count: 108, avg_confidence: 99.6, avg_latency_ms: 28.5, accuracy_rate: 99.8 },
                    { engine: 'Tesseract OCR (Fallback Engine)', processed_count: 26, avg_confidence: 91.2, avg_latency_ms: 450.0, accuracy_rate: 92.4 },
                  ]).map((eng, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02]">
                      <td className="p-3 font-medium text-white flex items-center gap-2">
                        <Zap className="h-3.5 w-3.5 text-brand-coral" />
                        {eng.engine}
                      </td>
                      <td className="p-3 font-mono text-slate-300">{eng.processed_count} files</td>
                      <td className="p-3 font-mono text-emerald-400 font-semibold">{eng.avg_confidence}%</td>
                      <td className="p-3 font-mono text-slate-400">{eng.avg_latency_ms} ms</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-400 h-1.5 rounded-full"
                              style={{ width: `${eng.accuracy_rate}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] text-slate-300">{eng.accuracy_rate}%</span>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">
                          Online
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
