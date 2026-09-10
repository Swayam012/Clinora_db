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
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Sidebar />

      <div className="flex flex-1 flex-col ml-64 min-w-0">
        <Topbar user={currentUser} />

        <main className="flex-1 space-y-6 p-8 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">Clinical Intelligence Analytics</h1>
                <Badge variant="mint" className="text-[10px]">
                  Real-time Telemetry
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                AI extraction accuracy, OCR pipeline throughput, and clinical diagnosis distribution metrics.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs text-slate-400 bg-slate-900 border border-white/10 px-3 py-1.5 rounded-lg">
                <Calendar className="h-3.5 w-3.5 text-brand-lavender" />
                <span>Last 30 Days</span>
              </span>
            </div>
          </div>

          {/* 4 KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="OCR Mean Accuracy"
              value="98.2%"
              trend="+1.4%"
              trendUp={true}
              icon={ScanLine}
              color="purple"
            />
            <StatCard
              label="Avg Extraction Latency"
              value="1.8s"
              trend="-0.4s"
              trendUp={true}
              icon={Zap}
              color="mint"
            />
            <StatCard
              label="Structured Data Yield"
              value="94.6%"
              trend="+3.2%"
              trendUp={true}
              icon={FileCheck}
              color="blue"
            />
            <StatCard
              label="AI Verification Rate"
              value="99.0%"
              trend="100% Grounded"
              trendUp={true}
              icon={CheckCircle2}
              color="coral"
            />
          </div>

          {/* Bento Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Columns: Common Diagnoses Distribution */}
            <Card className="lg:col-span-7 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-brand-coral" />
                  <CardTitle className="text-sm font-bold text-white">Top Extracted Clinical Diagnoses</CardTitle>
                </div>
                <span className="text-xs text-slate-400 font-mono">1,250 Patient Cohort</span>
              </div>

              <div className="space-y-3.5 pt-1">
                {diagnosisDistribution.map((d) => (
                  <div key={d.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-200">{d.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-400">{d.count} records</span>
                        <span className="font-bold text-white w-8 text-right">{d.percent}%</span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-white/[0.04]">
                      <div
                        style={{ width: `${d.percent}%`, backgroundColor: d.color }}
                        className="h-full rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Right 5 Columns: Departmental Throughput */}
            <Card className="lg:col-span-5 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-brand-lavender" />
                  <CardTitle className="text-sm font-bold text-white">Department Volume & Yield</CardTitle>
                </div>
                <Badge variant="outline" className="text-[10px]">Active</Badge>
              </div>

              <div className="space-y-2.5">
                {departmentVolumes.map((dept) => (
                  <div
                    key={dept.dept}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900/70 border border-white/[0.05]"
                  >
                    <div>
                      <div className="font-semibold text-xs text-white">{dept.dept}</div>
                      <div className="text-[11px] text-slate-400">{dept.docs} documents processed</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-emerald-400">{dept.rate}</div>
                      <div className="text-[10px] text-slate-500 font-mono">Precision</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
