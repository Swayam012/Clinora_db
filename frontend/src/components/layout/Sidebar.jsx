import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  Bot,
  Network,
  LineChart,
  LogOut,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/patients', label: 'Patients', icon: Users },
  { path: '/documents', label: 'Documents', icon: FolderOpen },
  { path: '/assistant', label: 'AI Assistant', icon: Bot },
  { path: '/knowledge-graph', label: 'Knowledge Graph', icon: Network },
  { path: '/analytics', label: 'Analytics', icon: LineChart },
];

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('clinora_token');
    navigate('/login');
  };

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-60 flex-col border-r border-slate-200 bg-white px-4 py-5">
      {/* Brand Header */}
      <div
        className="flex items-center gap-2.5 px-2 cursor-pointer mb-6"
        onClick={() => navigate('/dashboard')}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-purple text-white font-bold text-sm shadow-sm">
          C
        </div>
        <span className="text-lg font-bold tracking-tight text-slate-900">CLINORA</span>
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-1 flex-col space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "group flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-brand-purpleLight text-brand-purple font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )
              }
            >
              {({ isActive }) => (
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-colors",
                      isActive ? "text-brand-purple" : "text-slate-500 group-hover:text-slate-800"
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
      <div className="border-t border-slate-100 pt-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
