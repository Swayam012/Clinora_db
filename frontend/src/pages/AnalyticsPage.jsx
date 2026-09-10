import React from 'react';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { StatCard } from '../components/ui/stat-card';
import { Badge } from '../components/ui/badge';
import { currentUser } from '../services/mockData';
import {
  LineChart,
  TrendingUp,
  FileCheck,
  Clock,
  Bot,
  Activity,
  ScanLine,
  Zap,
  CheckCircle2,
  PieChart,
  BarChart3,
  Calendar,
} from 'lucide-react';

export default function AnalyticsPage() {
  const diagnosisDistribution = [
    { name: 'Essential Hypertension', count: 420, percent: 34, color: '#E8634B' },
    { name: 'Type 2 Diabetes', count: 310, percent: 25, color: '#7C5CBF' },
    { name: 'Angina / CAD', count: 215, percent: 17, color: '#34D399' },
    { name: 'Hyperlipidemia', count: 180, percent: 14, color: '#F59E0B' },
    { name: 'Asthma / COPD', count: 125, percent: 10, color: '#60A5FA' },
  ];

  const departmentVolumes = [
    { dept: 'Cardiology', docs: 1420, rate: '98.4%' },
    { dept: 'Endocrinology', docs: 950, rate: '97.8%' },
    { dept: 'General Medicine', docs: 810, rate: '99.1%' },
    { dept: 'Pulmonology', docs: 300, rate: '96.5%' },
  ];

  return (
    <div className="flex min-h-screen bg-brand-surface font-sans text-slate-900">
      <Sidebar />

      <div className="flex flex-1 flex-col ml-60 min-w-0">
        <Topbar breadcrumb="CLINORA / ANALYTICS" title="Clinical Intelligence Analytics" />

        <main className="flex-1 space-y-6 p-8 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">Clinical Performance & Telemetry</h1>
                <Badge variant="mint" className="text-[10px]">
                  Real-time Telemetry
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                AI extraction accuracy, OCR pipeline throughput, and clinical diagnosis distribution metrics.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs">
                <Calendar className="h-3.5 w-3.5 text-brand-purple" />
                <span>Last 30 Days</span>
              </span>
            </div>
          </div>

          {/* 4 KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'OCR MEAN ACCURACY', value: '98.2%', change: '+1.4%' },
              { label: 'AVG EXTRACTION LATENCY', value: '1.8s', change: '-0.4s' },
              { label: 'STRUCTURED DATA YIELD', value: '94.6%', change: '+3.2%' },
              { label: 'AI VERIFICATION RATE', value: '99.0%', change: '100% Grounded' },
            ].map((kpi, idx) => (
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

          {/* Bento Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Columns: Common Diagnoses Distribution */}
            <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-brand-purple" />
                  <h3 className="text-sm font-bold text-slate-900">Top Extracted Clinical Diagnoses</h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">1,250 Patient Cohort</span>
              </div>

              <div className="space-y-4 pt-1">
                {diagnosisDistribution.map((d) => (
                  <div key={d.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-800">{d.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-400">{d.count} records</span>
                        <span className="font-bold text-slate-900 w-8 text-right">{d.percent}%</span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${d.percent}%`, backgroundColor: d.color }}
                        className="h-full rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 5 Columns: Departmental Throughput */}
            <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-brand-purple" />
                  <h3 className="text-sm font-bold text-slate-900">Department Volume & Yield</h3>
                </div>
                <Badge variant="mint" className="text-[10px]">Active</Badge>
              </div>

              <div className="space-y-3">
                {departmentVolumes.map((dept) => (
                  <div
                    key={dept.dept}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/70"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900">{dept.dept}</div>
                      <div className="text-[11px] text-slate-500">{dept.docs} documents processed</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-emerald-600">{dept.rate}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Precision</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
