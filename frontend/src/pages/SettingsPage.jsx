import React from 'react';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { currentUser } from '../services/mockData';
import { reindexVectorStore } from '../services/api';
import {
  Settings,
  Shield,
  Database,
  Cpu,
  User,
  Key,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Sidebar />

      <div className="flex flex-1 flex-col ml-64 min-w-0">
        <Topbar user={currentUser} />

        <main className="flex-1 space-y-6 p-8 max-w-5xl mx-auto w-full">
          <div className="border-b border-white/[0.08] pb-4">
            <h1 className="text-xl font-bold text-white tracking-tight">System & Security Settings</h1>
            <p className="text-xs text-slate-400 mt-1">
              Configure OCR engines, ChromaDB vector indexing, and administrative credentials.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Profile */}
            <Card>
              <CardHeader className="border-b border-white/[0.04] pb-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-brand-coral" />
                  <CardTitle className="text-sm font-bold text-white">Active Practitioner Profile</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-4 text-xs">
                <div className="flex justify-between py-1 border-b border-white/[0.04]">
                  <span className="text-slate-400">Full Name</span>
                  <span className="font-semibold text-slate-200">Dr. Sharma</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.04]">
                  <span className="text-slate-400">Email</span>
                  <span className="font-mono text-slate-300">sharma@clinora.com</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.04]">
                  <span className="text-slate-400">System Role</span>
                  <Badge variant="mint">Clinical Administrator</Badge>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Institution</span>
                  <span className="text-slate-200">Vanderbilt Medical Center</span>
                </div>
              </CardContent>
            </Card>

            {/* AI Engine & OCR Pipeline */}
            <Card>
              <CardHeader className="border-b border-white/[0.04] pb-4">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-brand-purple" />
                  <CardTitle className="text-sm font-bold text-white">Engine Configuration</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-4 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-white/[0.04]">
                  <span className="text-slate-400">Primary OCR Engine</span>
                  <Badge variant="outline">RapidOCR ONNX Neural</Badge>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-white/[0.04]">
                  <span className="text-slate-400">PDF Native Extraction</span>
                  <Badge variant="mint">PyMuPDF Enabled</Badge>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-white/[0.04]">
                  <span className="text-slate-400">Vector Store</span>
                  <Badge variant="secondary">ChromaDB (Cosine)</Badge>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400">LLM Medical Entity Extractor</span>
                  <Badge variant="coral">Gemini + Heuristic Fallback</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
