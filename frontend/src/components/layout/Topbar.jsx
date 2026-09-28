import React from 'react';
import { useLocation } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const PAGE_NAMES = {
  '/dashboard': 'Dashboard',
  '/patients': 'Patients Management',
  '/documents': 'Clinical Documents Repository',
  '/knowledge-graph': 'Clinical Knowledge Graph',
  '/graph': 'Clinical Knowledge Graph',
  '/ai-tools': 'AI Intelligence & Clinical RAG',
  '/ai-assistant': 'AI Intelligence & Clinical RAG',
  '/agents': 'Clinical AI Agents Hub',
  '/ai-agents': 'Clinical AI Agents Hub',
  '/analytics': 'Clinical Telemetry & Analytics',
  '/settings': 'System Settings',
};

export default function Topbar({ user }) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const pageTitle = PAGE_NAMES[location.pathname] || 'Clinical Intelligence Platform';

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-white/[0.06] bg-slate-950/80 px-8 backdrop-blur-xl">
      <div className="flex items-center gap-2.5">
        <span className="text-xs font-semibold text-slate-300 tracking-wide">{pageTitle}</span>
      </div>

      <div className="flex items-center gap-3">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white transition-all shadow-sm"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 text-amber-400 hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="h-4 w-4 text-brand-purple hover:-rotate-12 transition-transform" />
          )}
        </button>

        {user?.email && (
          <span className="text-[11px] font-mono text-slate-500">
            {user.email}
          </span>
        )}
      </div>
    </header>
  );
}
