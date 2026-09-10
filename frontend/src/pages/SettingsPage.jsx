import React, { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { currentUser } from '../services/mockData';
import {
  Settings,
  Shield,
  Bot,
  ScanLine,
  Database,
  Key,
  CheckCircle2,
  Lock,
  User,
  Save,
  Activity,
} from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [model, setModel] = useState('gemini-2.5-flash');
  const [ocrDpi, setOcrDpi] = useState('300');
  const [rateLimit, setRateLimit] = useState('30/minute');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Sidebar />

      <div className="flex flex-1 flex-col ml-64 min-w-0">
        <Topbar user={currentUser} />

        <main className="flex-1 p-8 space-y-6 max-w-5xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">System Settings & Configuration</h1>
                <Badge variant="secondary" className="text-[10px]">
                  Administrator
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage organization profile, AI model pipelines, OCR parameters, and security policies.
              </p>
            </div>

            <Button
              variant="coral"
              size="sm"
              className="h-8 text-xs font-semibold"
              onClick={handleSave}
            >
              {saved ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                  Saved Changes!
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  Save Settings
                </>
              )}
            </Button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-white/[0.06] pb-2">
            {[
              { id: 'general', label: 'General & Profile', icon: User },
              { id: 'ai', label: 'AI & Intelligence', icon: Bot },
              { id: 'ocr', label: 'OCR Engine', icon: ScanLine },
              { id: 'security', label: 'Security & Rate Limits', icon: Shield },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-brand-purple/20 text-white font-semibold border border-brand-purple/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Contents */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <Card className="p-5 space-y-4">
                <CardTitle className="text-sm font-bold text-white">Clinic / Institution Information</CardTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Organization Name</label>
                    <input
                      type="text"
                      defaultValue="Clinora Healthcare System"
                      className="w-full h-9 rounded-lg border border-white/10 bg-slate-900 px-3 text-white focus:border-brand-purple focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Facility Code</label>
                    <input
                      type="text"
                      defaultValue="CLINORA-MED-01"
                      className="w-full h-9 rounded-lg border border-white/10 bg-slate-900 px-3 font-mono text-white focus:border-brand-purple focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Admin Contact Email</label>
                    <input
                      type="email"
                      defaultValue="sharma@clinora.com"
                      className="w-full h-9 rounded-lg border border-white/10 bg-slate-900 px-3 text-white focus:border-brand-purple focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Default Timezone</label>
                    <input
                      type="text"
                      defaultValue="UTC+05:30 (IST)"
                      className="w-full h-9 rounded-lg border border-white/10 bg-slate-900 px-3 text-white focus:border-brand-purple focus:outline-none"
                    />
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-4">
              <Card className="p-5 space-y-4">
                <CardTitle className="text-sm font-bold text-white">Clinical AI Models & RAG Engine</CardTitle>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Primary LLM Provider</label>
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full h-9 rounded-lg border border-white/10 bg-slate-900 px-3 text-white focus:border-brand-purple focus:outline-none"
                    >
                      <option value="gemini-2.5-flash">Google Gemini 2.5 Flash (Recommended - Native JSON)</option>
                      <option value="gemini-1.5-flash">Google Gemini 1.5 Flash</option>
                      <option value="local-heuristic">Built-in Medical Heuristic Parser (Offline Mode)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">RAG Context Retrieval Chunks (Top-K)</label>
                    <input
                      type="number"
                      defaultValue="4"
                      className="w-full h-9 rounded-lg border border-white/10 bg-slate-900 px-3 text-white focus:border-brand-purple focus:outline-none"
                    />
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'ocr' && (
            <div className="space-y-4">
              <Card className="p-5 space-y-4">
                <CardTitle className="text-sm font-bold text-white">OCR Engine Parameters</CardTitle>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Page Rendering DPI</label>
                    <select
                      value={ocrDpi}
                      onChange={(e) => setOcrDpi(e.target.value)}
                      className="w-full h-9 rounded-lg border border-white/10 bg-slate-900 px-3 text-white focus:border-brand-purple focus:outline-none"
                    >
                      <option value="300">300 DPI (High Precision Medical Scans)</option>
                      <option value="200">200 DPI (Balanced Speed/Accuracy)</option>
                      <option value="150">150 DPI (Fast Ingestion)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Neural Model Engine</label>
                    <input
                      type="text"
                      disabled
                      value="RapidOCR ONNX Neural Pipeline + PyMuPDF"
                      className="w-full h-9 rounded-lg border border-white/10 bg-slate-950 px-3 text-slate-400"
                    />
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              <Card className="p-5 space-y-4">
                <CardTitle className="text-sm font-bold text-white">Rate Limiting & Security Defenses</CardTitle>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Authentication Rate Limit (per IP)</label>
                    <select
                      value={rateLimit}
                      onChange={(e) => setRateLimit(e.target.value)}
                      className="w-full h-9 rounded-lg border border-white/10 bg-slate-900 px-3 text-white focus:border-brand-purple focus:outline-none"
                    >
                      <option value="30/minute">30 requests / minute (Development Default)</option>
                      <option value="5/15minute">5 requests / 15 minutes (Strict Production)</option>
                      <option value="60/minute">60 requests / minute (High Throughput)</option>
                    </select>
                  </div>

                  <div className="pt-2 border-t border-white/[0.06] space-y-2">
                    <span className="font-semibold text-slate-300">Active Defenses:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-400">
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>File Magic Byte Inspection</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>X-Content-Type-Options: nosniff</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>X-Frame-Options: SAMEORIGIN</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>JWT Bearer Route Guards</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
