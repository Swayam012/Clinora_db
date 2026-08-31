import * as React from "react";
import { cn } from "../../lib/utils";

const Input = React.forwardRef(({ className, type, icon: Icon, ...props }, ref) => {
  if (Icon) {
    return (
      <div className="relative w-full">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
          <Icon className="h-4 w-4" />
        </div>
        <input
          type={type}
          className={cn(
            "flex h-9 w-full rounded-lg border border-white/10 bg-slate-900/80 pl-9 pr-3 py-1 text-sm text-slate-100 placeholder:text-slate-500 transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-purple focus-visible:border-brand-purple disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  }

  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-lg border border-white/10 bg-slate-900/80 px-3 py-1 text-sm text-slate-100 placeholder:text-slate-500 transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-purple focus-visible:border-brand-purple disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
