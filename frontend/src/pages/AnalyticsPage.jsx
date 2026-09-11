import React from 'react';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { StatCard } from '../components/ui/stat-card';
import { Badge } from '../components/ui/badge';
import { currentUser } from '../services/mockData';
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
} from 'lucide-react';

export default function AnalyticsPage() {
  const diagnosisDistribution = [
    { name: 'Essential Hypertension (I10)', count: 412, pct: 33 },
    { name: 'Type 2 Diabetes Mellitus (E11.9)', count: 285, pct: 23 },
    { name: 'Invasive Lobular Carcinoma (C50.9)', count: 178, pct: 14 },
    { name: 'Coronary Artery Disease (I25.10)', count: 145, pct: 12 },
    { name: 'Asthma & Bronchospasm (J45.909)', count: 110, pct: 9 },
  ];

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Sidebar />

      <div className="flex flex-1 flex-col ml-64 min-w-0">
        <Topbar user={currentUser} />

        <main className="flex-1 space-y-6 p-8 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">Clinical Telemetry & Analytics</h1>
                <Badge variant="mint" className="text-[10px]">Real-Time Monitoring</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Hospital document throughput, OCR accuracy rates, and AI entity extraction metrics.
              </p>
            </div>
          </div>

          {/* 4 Stat Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="OCR Success Rate"
              value="98.4%"
              trend="+0.8%"
              trendUp={true}
              icon={FileCheck}
              color="mint"
            />
            <StatCard
              label="Avg Vector Latency"
              value="42 ms"
              trend="Optimal"
              trendUp={true}
              icon={Clock}
              color="purple"
            />
            <StatCard
              label="Extracted Entities"
              value="14,892"
              trend="+18.5%"
              trendUp={true}
              icon={Brain}
              color="coral"
            />
            <StatCard
              label="Active RAG Citations"
              value="3,480"
              trend="+24.1%"
              trendUp={true}
              icon={Database}
              color="blue"
            />
          </div>

          {/* Diagnosis & Processing Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-7">
              <CardHeader className="border-b border-white/[0.04] pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-brand-coral" />
                    <CardTitle className="text-sm font-bold text-white">Top Extracted Clinical Diagnoses</CardTitle>
                  </div>
                  <span className="text-xs font-mono text-slate-500">ICD-10 Cohorts</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {diagnosisDistribution.map((d, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-200">{d.name}</span>
                      <span className="font-mono text-slate-400">{d.count} patients ({d.pct}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden">
                      <div
                        style={{ width: `${d.pct}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-brand-purple to-brand-coral"
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="lg:col-span-5">
              <CardHeader className="border-b border-white/[0.04] pb-4">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-brand-lavender" />
                  <CardTitle className="text-sm font-bold text-white">Ingestion Pipeline Distribution</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-white/[0.05] flex justify-between items-center">
                  <span className="text-slate-300">Laboratory & Pathology Reports</span>
                  <Badge variant="mint">44%</Badge>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-white/[0.05] flex justify-between items-center">
                  <span className="text-slate-300">Physician Prescriptions</span>
                  <Badge variant="outline">26%</Badge>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-white/[0.05] flex justify-between items-center">
                  <span className="text-slate-300">Clinical Consultation Notes</span>
                  <Badge variant="coral">18%</Badge>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-white/[0.05] flex justify-between items-center">
                  <span className="text-slate-300">Discharge Summaries</span>
                  <Badge variant="secondary">12%</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
