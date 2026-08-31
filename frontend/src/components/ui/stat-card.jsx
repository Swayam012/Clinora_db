import React from "react";
import { cn } from "../../lib/utils";
import { ArrowUpRight, ArrowDownRight, MoreHorizontal } from "lucide-react";

export function StatCard({
  label,
  value,
  trend,
  trendUp,
  icon: Icon,
  color = "purple",
  className,
}) {
  const colorSchemes = {
    purple: {
      badge: "text-brand-lavender bg-brand-purple/15 border-brand-purple/20",
      bar: "bg-gradient-to-r from-brand-purple to-indigo-500",
      iconBg: "bg-brand-purple/10 text-brand-lavender",
    },
    mint: {
      badge: "text-emerald-300 bg-emerald-500/15 border-emerald-500/20",
      bar: "bg-gradient-to-r from-emerald-500 to-teal-400",
      iconBg: "bg-emerald-500/10 text-emerald-300",
    },
    coral: {
      badge: "text-rose-300 bg-rose-500/15 border-rose-500/20",
      bar: "bg-gradient-to-r from-rose-500 to-orange-400",
      iconBg: "bg-rose-500/10 text-rose-300",
    },
    blue: {
      badge: "text-sky-300 bg-sky-500/15 border-sky-500/20",
      bar: "bg-gradient-to-r from-sky-500 to-blue-500",
      iconBg: "bg-sky-500/10 text-sky-300",
    },
    amber: {
      badge: "text-amber-300 bg-amber-500/15 border-amber-500/20",
      bar: "bg-gradient-to-r from-amber-500 to-yellow-400",
      iconBg: "bg-amber-500/10 text-amber-300",
    },
  };

  const scheme = colorSchemes[color] || colorSchemes.purple;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-white/[0.08] bg-slate-900/60 p-5 shadow-lg backdrop-blur-sm transition-all duration-200 hover:border-white/[0.15] hover:bg-slate-900/80",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg border border-white/5", scheme.iconBg)}>
              <Icon className="h-4 w-4" />
            </div>
          )}
          <span className="text-xs font-medium text-slate-400">{label}</span>
        </div>

        {trend ? (
          <div
            className={cn(
              "flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
              trendUp
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                : "border-rose-500/20 bg-rose-500/10 text-rose-400"
            )}
          >
            {trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            <span>{trend}</span>
          </div>
        ) : (
          <button className="text-slate-500 hover:text-slate-300 transition-colors">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-3">
        <div className="text-2xl font-bold tracking-tight text-white">{value}</div>
      </div>

      {/* Subtle indicator line */}
      <div className="mt-3.5 h-1 w-full overflow-hidden rounded-full bg-white/[0.04]">
        <div className={cn("h-full w-2/3 rounded-full transition-all duration-500", scheme.bar)} />
      </div>
    </div>
  );
}
