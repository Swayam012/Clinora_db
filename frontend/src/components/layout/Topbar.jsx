import React from 'react';
import { Search, Bell } from 'lucide-react';

export default function Topbar({
  breadcrumb = "CLINORA / DASHBOARD",
  title = "Clinical Command Center"
}) {
  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-slate-200 bg-white px-8">
      {/* Breadcrumb & Title */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {breadcrumb}
        </p>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 mt-0.5">
          {title}
        </h1>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        {/* Search Bar */}
        <div className="relative w-64 md:w-72">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient, MRN, doc..."
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/70 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-brand-purple focus:bg-white focus:outline-none"
          />
        </div>

        {/* Bell Notification */}
        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 overflow-hidden border border-slate-300">
            <img
              src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=120"
              alt="Dr. S. Vance"
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <span className="text-xs font-bold text-slate-700">SV</span>
          </div>
          <div className="text-left leading-tight hidden sm:block">
            <p className="text-xs font-bold text-slate-900">Dr. S. Vance</p>
            <p className="text-[11px] text-slate-500 font-medium">Chief Oncologist</p>
          </div>
        </div>
      </div>
    </header>
  );
}
