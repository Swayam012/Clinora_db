import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-purple-200 bg-purple-50 text-brand-purple",
        secondary:
          "border-slate-200 bg-slate-100 text-slate-700",
        destructive:
          "border-red-200 bg-red-50 text-red-700",
        outline: "text-slate-700 border-slate-200",
        mint:
          "border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold",
        amber:
          "border-amber-200 bg-amber-50 text-amber-700 font-semibold",
        coral:
          "border-red-200 bg-red-50 text-red-700 font-semibold",
        blue:
          "border-sky-200 bg-sky-50 text-sky-700 font-semibold",
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
