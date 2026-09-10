import React, { useState, useEffect } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { currentUser } from '../services/mockData';
import { getPatients, getDocuments } from '../services/api';
import {
  ClipboardList,
  FileText,
  Download,
  Printer,
  Sparkles,
  Users,
  CheckCircle2,
  Calendar,
  Stethoscope,
  Pill,
  Activity,
  Share2,
} from 'lucide-react';

export default function ReportsPage() {
  const [reportType, setReportType] = useState('longitudinal');
  const [selectedPatient, setSelectedPatient] = useState('Emily Johnson');
  const [reportGenerated, setReportGenerated] = useState(true);

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Sidebar />

      <div className="flex flex-1 flex-col ml-64 min-w-0">
        <Topbar user={currentUser} />

        <main className="flex-1 p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Top Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">Clinical Reports & Handover Summaries</h1>
                <Badge variant="coral" className="text-[10px]">
                  Automated Synthesis
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate standardized discharge summaries, multi-record longitudinal briefs, and lab trends.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs border-white/10 text-slate-300"
                onClick={() => window.print()}
              >
                <Printer className="h-3.5 w-3.5 mr-1.5" />
                Print Record
              </Button>
              <Button
                variant="coral"
                size="sm"
                className="h-8 text-xs font-semibold"
                onClick={() => alert('Exporting structured PDF clinical report...')}
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Export PDF
              </Button>
            </div>
          </div>

          {/* Report Configuration & Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 space-y-2 border-white/[0.08]">
              <label className="text-xs font-semibold text-slate-300">Report Category</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full h-9 rounded-lg border border-white/10 bg-slate-900 px-3 text-xs text-white focus:outline-none focus:border-brand-purple"
              >
                <option value="longitudinal">Patient Longitudinal Summary</option>
                <option value="discharge">Discharge Clinical Brief</option>
                <option value="lab_trends">Laboratory & Biomarker Trends</option>
              </select>
            </Card>

            <Card className="p-4 space-y-2 border-white/[0.08]">
              <label className="text-xs font-semibold text-slate-300">Select Patient Cohort</label>
              <select
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                className="w-full h-9 rounded-lg border border-white/10 bg-slate-900 px-3 text-xs text-white focus:outline-none focus:border-brand-purple"
              >
                <option value="Emily Johnson">Emily Johnson (PAT-2026-00001)</option>
                <option value="Rajesh Kumar">Rajesh Kumar (PAT-2026-00002)</option>
              </select>
            </Card>

            <Card className="p-4 space-y-2 border-white/[0.08] flex items-end">
              <Button
                variant="purple"
                size="sm"
                className="w-full h-9 text-xs font-semibold"
                onClick={() => setReportGenerated(true)}
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5 text-brand-coral" />
                Regenerate AI Synthesis
              </Button>
            </Card>
          </div>

          {/* Printable Report Document Sheet */}
          <Card className="p-8 space-y-6 bg-slate-900/50 border-white/[0.08] text-xs leading-relaxed max-w-4xl mx-auto shadow-2xl">
            {/* Report Header */}
            <div className="flex justify-between items-start border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-white tracking-tight">CLINORA MEDICAL CENTER</span>
                  <Badge variant="mint" className="text-[10px]">Verified Record</Badge>
                </div>
                <p className="text-xs text-slate-400 mt-1">Department of Cardiovascular & General Medicine</p>
              </div>
              <div className="text-right text-[11px] text-slate-400 font-mono">
                <div>Date: {new Date().toLocaleDateString()}</div>
                <div>ID: CLINORA-RPT-2026-089</div>
              </div>
            </div>

            {/* Patient Header Block */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/80 p-3.5 rounded-xl border border-white/[0.05]">
              <div>
                <span className="text-slate-500 text-[10px] uppercase">Patient Name</span>
                <div className="font-bold text-white text-xs">{selectedPatient}</div>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase">Patient ID</span>
                <div className="font-mono text-brand-lavender text-xs">PAT-2026-00001</div>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase">Attending Physician</span>
                <div className="font-medium text-slate-200 text-xs">Dr. Sharma, MD</div>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase">Clinical Status</span>
                <div className="font-semibold text-emerald-400 text-xs">Stable Management</div>
              </div>
            </div>

            {/* Diagnoses & ICD-10 */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Stethoscope className="h-4 w-4 text-brand-coral" />
                Primary Diagnoses & Clinical Findings
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-white/[0.05] flex justify-between items-center">
                  <span className="font-medium text-slate-200">Essential Hypertension</span>
                  <Badge variant="outline" className="font-mono text-[10px] text-amber-400 border-amber-500/30">
                    ICD-10: I10
                  </Badge>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-white/[0.05] flex justify-between items-center">
                  <span className="font-medium text-slate-200">Angina Pectoris / Chest Discomfort</span>
                  <Badge variant="outline" className="font-mono text-[10px] text-amber-400 border-amber-500/30">
                    ICD-10: I20.9
                  </Badge>
                </div>
              </div>
            </div>

            {/* Active Medications */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Pill className="h-4 w-4 text-emerald-400" />
                Active Pharmacological Regimen
              </h3>
              <div className="p-3 rounded-lg bg-slate-950 border border-white/[0.05] space-y-1.5">
                <div className="flex justify-between items-center border-b border-white/[0.04] pb-1">
                  <span className="font-semibold text-white">Amlodipine 5mg</span>
                  <span className="text-slate-400">Oral &bull; Once daily in morning</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="font-semibold text-white">Aspirin 75mg</span>
                  <span className="text-slate-400">Oral &bull; Once daily with food</span>
                </div>
              </div>
            </div>

            {/* Physician Recommendations */}
            <div className="space-y-2 border-t border-white/10 pt-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Follow-up & Care Plan
              </h3>
              <ul className="list-disc pl-4 space-y-1 text-slate-300">
                <li>Follow-up clinical review scheduled in 4 weeks.</li>
                <li>Continue daily home blood pressure logging (target: &lt; 130/80 mmHg).</li>
                <li>Maintain low-sodium dietary modifications.</li>
              </ul>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}
