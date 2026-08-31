import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-brand-purple/20 text-brand-lavender border-brand-purple/30",
        secondary:
          "border-transparent bg-slate-800 text-slate-300 border-white/5",
        destructive:
          "border-transparent bg-red-500/15 text-red-400 border-red-500/20",
        outline: "text-slate-300 border-white/10",
        mint:
          "border-emerald-500/30 bg-emerald-500/15 text-emerald-300 font-semibold",
        amber:
          "border-amber-500/30 bg-amber-500/15 text-amber-300 font-semibold",
        coral:
          "border-rose-500/30 bg-rose-500/15 text-rose-300 font-semibold",
        blue:
          "border-sky-500/30 bg-sky-500/15 text-sky-300 font-semibold",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
