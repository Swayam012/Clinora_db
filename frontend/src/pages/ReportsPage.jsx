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
    <div className="flex min-h-screen bg-brand-surface font-sans text-slate-900">
      <Sidebar />

      <div className="flex flex-1 flex-col ml-60 min-w-0">
        <Topbar breadcrumb="CLINORA / REPORTS" title="Clinical Reports & Summaries" />

        <main className="flex-1 p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Top Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">Clinical Reports & Handover Summaries</h1>
                <Badge variant="mint" className="text-[10px]">
                  Automated Synthesis
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Generate standardized discharge summaries, multi-record longitudinal briefs, and lab trends.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs border-slate-200 text-slate-700 bg-white hover:bg-slate-50"
                onClick={() => window.print()}
              >
                <Printer className="h-3.5 w-3.5 mr-1.5" />
                Print Record
              </Button>
              <Button
                variant="default"
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
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 shadow-sm">
              <label className="text-xs font-semibold text-slate-700">Report Category</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-800 focus:outline-none focus:border-brand-purple"
              >
                <option value="longitudinal">Patient Longitudinal Summary</option>
                <option value="discharge">Discharge Clinical Brief</option>
                <option value="lab_trends">Laboratory & Biomarker Trends</option>
              </select>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 shadow-sm">
              <label className="text-xs font-semibold text-slate-700">Select Patient Cohort</label>
              <select
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-800 focus:outline-none focus:border-brand-purple"
              >
                <option value="Evelyn Carter">Evelyn Carter (MRN-902-18)</option>
                <option value="Marcus Chen">Marcus Chen (MRN-334-09)</option>
              </select>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 shadow-sm flex items-end">
              <Button
                variant="default"
                size="sm"
                className="w-full h-9 text-xs font-semibold"
                onClick={() => setReportGenerated(true)}
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5 text-purple-200" />
                Regenerate AI Synthesis
              </Button>
            </div>
          </div>

          {/* Printable Report Document Sheet */}
          <div className="p-8 space-y-6 bg-white border border-slate-200 rounded-xl text-xs leading-relaxed max-w-4xl mx-auto shadow-sm">
            {/* Report Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-slate-900 tracking-tight">CLINORA MEDICAL CENTER</span>
                  <Badge variant="mint" className="text-[10px]">Verified Record</Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1">Department of Oncology & Clinical Research</p>
              </div>
              <div className="text-right text-[11px] text-slate-500 font-mono">
                <div>Date: {new Date().toLocaleDateString()}</div>
                <div>ID: CLINORA-RPT-2026-089</div>
              </div>
            </div>

            {/* Patient Header Block */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 text-[10px] uppercase">Patient Name</span>
                <div className="font-bold text-slate-900 text-xs">{selectedPatient}</div>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase">Patient ID</span>
                <div className="font-mono text-brand-purple text-xs font-bold">MRN-902-18</div>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase">Attending Physician</span>
                <div className="font-medium text-slate-800 text-xs">Dr. Sarah Vance</div>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase">Clinical Status</span>
                <div className="font-semibold text-emerald-700 text-xs">Active Treatment</div>
              </div>
            </div>

            {/* Diagnoses & ICD-10 */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Stethoscope className="h-4 w-4 text-brand-purple" />
                Primary Diagnoses & Clinical Findings
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <span className="font-medium text-slate-800">Stage IIIA Invasive Lobular Carcinoma</span>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    ICD-10: C50.9
                  </Badge>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <span className="font-medium text-slate-800">Estrogen Receptor Positive (ER+)</span>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    Z85.3
                  </Badge>
                </div>
              </div>
            </div>

            {/* Active Medications */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Pill className="h-4 w-4 text-emerald-600" />
                Active Pharmacological Regimen
              </h3>
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
                  <span className="font-bold text-slate-900">Letrozole 2.5mg QD</span>
                  <span className="text-slate-500">Oral &bull; Once daily in morning</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="font-bold text-slate-900">Palbociclib 125mg QD (Cycle 2, Day 14)</span>
                  <span className="text-slate-500">Oral &bull; Once daily with food</span>
                </div>
              </div>
            </div>

            {/* Physician Recommendations */}
            <div className="space-y-2 border-t border-slate-200 pt-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Follow-up & Care Plan
              </h3>
              <ul className="list-disc pl-4 space-y-1 text-slate-600">
                <li>Follow-up clinical oncology review scheduled in 4 weeks.</li>
                <li>Check CBC blood panel for WBC monitoring.</li>
                <li>Continue prescribed oral oncology regimen.</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
