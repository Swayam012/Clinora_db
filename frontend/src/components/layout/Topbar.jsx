import React from 'react';
import { useLocation } from 'react-router-dom';

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
  const pageTitle = PAGE_NAMES[location.pathname] || 'Clinical Intelligence Platform';

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-white/[0.06] bg-slate-950/80 px-8 backdrop-blur-xl">
      <div className="flex items-center gap-2.5">
        <span className="text-xs font-semibold text-slate-300 tracking-wide">{pageTitle}</span>
      </div>

      <div className="flex items-center gap-3">
        {user?.email && (
          <span className="text-[11px] font-mono text-slate-500">
            {user.email}
          </span>
        )}
      </div>
    </header>
  );
}
