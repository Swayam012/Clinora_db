import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  LineChart,
  Bot,
  Network,
  Settings,
  LogOut,
  Sparkles,
  Activity,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { logoutUser } from '../../services/api';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/patients', label: 'Patients', icon: Users },
  { path: '/documents', label: 'Documents', icon: FileText },
  { path: '/knowledge-graph', label: 'Knowledge Graph', icon: Network },
  { path: '/ai-tools', label: 'AI Intelligence', icon: Bot },
  { path: '/agents', label: 'Discharge Agent', icon: Sparkles },
  { path: '/analytics', label: 'Analytics', icon: LineChart },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutUser();
    navigate('/login');
  };

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-white/[0.08] bg-slate-950 px-4 py-5 backdrop-blur-xl">
      {/* Brand Header */}
      <div
        className="flex items-center gap-3 px-2 cursor-pointer group"
        onClick={() => navigate('/dashboard')}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-purple via-indigo-500 to-brand-coral text-white font-bold shadow-md shadow-brand-purple/20 transition-transform group-hover:scale-105">
          <Activity className="h-4 w-4" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold tracking-tight text-white">CLINORA</span>
            <span className="rounded bg-brand-purple/20 px-1 py-0.2 text-[9px] font-semibold text-brand-lavender border border-brand-purple/30">
              AI
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium">Clinical Intelligence</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="mt-6 flex flex-1 flex-col space-y-1">
        <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Core Platform
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "group flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150",
                  isActive
                    ? "bg-brand-purple/15 text-white font-semibold border border-brand-purple/30 shadow-sm shadow-brand-purple/10"
                    : "text-slate-400 hover:bg-slate-900/80 hover:text-slate-100"
                )
              }
            >
              {({ isActive }) => (
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-colors",
                      isActive ? "text-brand-lavender" : "text-slate-400 group-hover:text-slate-200"
                    )}
                  />
                  <span>{item.label}</span>
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Profile / Logout */}
      <div className="border-t border-white/[0.08] pt-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20 border border-transparent"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
