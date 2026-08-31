import React from 'react';
import { Search, Bell, Command, User, Sparkles } from 'lucide-react';
import { Input } from '../ui/input';

export default function Topbar({ user }) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-white/[0.08] bg-slate-950/80 px-8 backdrop-blur-xl">
      {/* Greeting Title */}
      <div>
        <span className="text-xs text-slate-400 font-normal">{getGreeting()},</span>
        <h1 className="text-base font-bold text-white tracking-tight">
          {user?.full_name || 'Dr. Sharma'}
        </h1>
      </div>

      {/* Global Actions */}
      <div className="flex items-center gap-3.5">
        {/* Quick Search with Command Palette trigger */}
        <div className="relative w-64 md:w-72">
          <Input
            icon={Search}
            placeholder="Search patients, docs (⌘K)..."
            className="h-9 bg-slate-900/60 pr-8 text-xs"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-2.5 hidden h-4 select-none items-center gap-1 rounded border border-white/10 bg-slate-800 px-1 font-mono text-[9px] font-medium text-slate-400 sm:flex">
            ⌘K
          </kbd>
        </div>

        {/* AI Status Badge */}
        <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>AI Engine Ready</span>
        </div>

        {/* Notifications Button */}
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-slate-900/60 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-coral" />
        </button>

        {/* User Profile Pill */}
        <div className="flex items-center gap-2.5 rounded-lg border border-white/[0.08] bg-slate-900/60 p-1 pl-2 pr-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-tr from-brand-purple to-indigo-600 font-bold text-white text-xs shadow-sm">
            {user?.full_name?.charAt(0) || 'D'}
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold text-slate-100 leading-tight">
              {user?.full_name || 'Dr. Sharma'}
            </p>
            <p className="text-[10px] text-slate-400 font-medium capitalize">
              {user?.role || 'Clinician'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
