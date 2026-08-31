import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-brand-purple text-white shadow hover:bg-brand-purple/90 border border-brand-purple/50",
        coral:
          "bg-brand-coral text-white shadow-lg shadow-brand-coral/25 hover:bg-brand-coral/90 border border-brand-coral/40",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
        outline:
          "border border-white/10 bg-slate-900/40 hover:bg-slate-800/80 hover:text-white text-slate-300",
        secondary:
          "bg-slate-800/80 text-slate-200 hover:bg-slate-700/80 border border-white/5",
        ghost:
          "hover:bg-slate-800/60 hover:text-white text-slate-400",
        link:
          "text-brand-lavender underline-offset-4 hover:underline",
        ai:
          "bg-gradient-to-r from-brand-purple via-indigo-500 to-brand-coral text-white shadow-lg shadow-brand-purple/20 hover:opacity-95 border border-white/10",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-8 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = "Button";

export { Button, buttonVariants };
