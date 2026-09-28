import React, { useState, useEffect } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { getCurrentUser, reindexVectorStore } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import {
  Settings,
  Shield,
  Database,
  Cpu,
  User,
  CheckCircle2,
  Lock,
  Loader2,
  Sun,
  Moon,
  Palette,
} from 'lucide-react';

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [reindexing, setReindexing] = useState(false);
  const [reindexSuccess, setReindexSuccess] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    async function loadUser() {
      try {
        const userData = await getCurrentUser();
        if (userData) {
          setUser(userData);
        }
      } catch (err) {
        console.debug('Failed to load user profile:', err);
      } finally {
        setLoadingUser(false);
      }
    }
    loadUser();
  }, []);

  const handleReindex = async () => {
    setReindexing(true);
    setReindexSuccess(false);
    try {
      await reindexVectorStore();
      setReindexSuccess(true);
      setTimeout(() => setReindexSuccess(false), 4000);
    } catch (err) {
      alert(`Reindexing failed: ${err.message}`);
    } finally {
      setReindexing(false);
    }
  };

  const getRoleLabel = (role) => {
    if (!role) return 'Clinician';
    if (role.toLowerCase() === 'admin') return 'Administrator';
    if (role.toLowerCase() === 'clinician') return 'Practicing Clinician';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Sidebar />

      <div className="flex flex-1 flex-col ml-64 min-w-0">
        <Topbar user={user} />

        <main className="flex-1 space-y-6 p-8 max-w-5xl mx-auto w-full">
          <div className="border-b border-white/[0.08] pb-4">
            <h1 className="text-xl font-bold text-white tracking-tight">System & Security Settings</h1>
            <p className="text-xs text-slate-400 mt-1">
              User credentials, AI vector index configuration, and security settings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Actual User Profile */}
            <Card className="border-white/[0.08] bg-slate-900/80 backdrop-blur-xl">
              <CardHeader className="border-b border-white/[0.04] pb-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-brand-coral" />
                  <CardTitle className="text-sm font-bold text-white">Active User Profile</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-4 text-xs">
                <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
                  <span className="text-slate-400">Full Name</span>
                  <span className="font-semibold text-slate-200">
                    {loadingUser ? 'Loading...' : user?.full_name || 'Anonymous User'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
                  <span className="text-slate-400">Email Address</span>
                  <span className="font-mono text-slate-300">
                    {loadingUser ? 'Loading...' : user?.email || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
                  <span className="text-slate-400">Account Role</span>
                  <Badge variant="mint" className="text-[10px]">
                    {getRoleLabel(user?.role)}
                  </Badge>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Account Status</span>
                  <span className="text-emerald-400 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="h-3 w-3" /> Active & Verified
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Interface Theme & Appearance Card */}
            <Card className="border-white/[0.08] bg-slate-900/80 backdrop-blur-xl">
              <CardHeader className="border-b border-white/[0.04] pb-4">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-purple-400" />
                  <CardTitle className="text-sm font-bold text-white">Interface & Theme Settings</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-4 text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-white/[0.04]">
                  <span className="text-slate-400">Active Color Mode</span>
                  <Badge variant={theme === 'dark' ? 'purple' : 'coral'} className="text-[10px] capitalize">
                    {theme} Mode
                  </Badge>
                </div>
                <div className="py-2">
                  <label className="text-slate-400 block mb-2 font-medium">Select Theme Palette:</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setTheme('dark')}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                        theme === 'dark'
                          ? 'border-brand-purple bg-brand-purple/20 text-white font-semibold ring-1 ring-brand-purple'
                          : 'border-white/10 bg-slate-950/60 text-slate-400 hover:border-white/20'
                      }`}
                    >
                      <Moon className="h-4 w-4 text-brand-purple" />
                      <span>Dark Theme</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme('light')}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                        theme === 'light'
                          ? 'border-brand-coral bg-brand-coral/20 text-white font-semibold ring-1 ring-brand-coral'
                          : 'border-white/10 bg-slate-950/60 text-slate-400 hover:border-white/20'
                      }`}
                    >
                      <Sun className="h-4 w-4 text-amber-400" />
                      <span>Light Theme</span>
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ChromaDB Vector Index */}
            <Card className="border-white/[0.08] bg-slate-900/80 backdrop-blur-xl">
              <CardHeader className="border-b border-white/[0.04] pb-4">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-brand-lavender" />
                  <CardTitle className="text-sm font-bold text-white">ChromaDB Vector Store</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-4 text-xs">
                <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
                  <span className="text-slate-400">Embedding Engine</span>
                  <span className="font-semibold text-slate-200">Cosine Similarity (HNSW)</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
                  <span className="text-slate-400">Index Status</span>
                  <span className="text-emerald-400 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="h-3 w-3" /> Synced with PostgreSQL
                  </span>
                </div>
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReindex}
                    disabled={reindexing}
                    className="w-full text-xs border-white/10"
                  >
                    {reindexing ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin text-brand-coral" />
                        Re-indexing All Documents...
                      </>
                    ) : (
                      'Re-index Vector Database'
                    )}
                  </Button>
                  {reindexSuccess && (
                    <p className="text-[10px] text-emerald-400 mt-1.5 text-center font-medium">
                      ✓ Vector database re-indexed successfully.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
