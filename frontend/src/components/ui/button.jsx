import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-brand-purple text-white shadow-sm hover:bg-brand-purpleDark border border-brand-purple",
        coral:
          "bg-brand-purple text-white shadow-sm hover:bg-brand-purpleDark border border-brand-purple",
        destructive:
          "bg-brand-rose text-white hover:bg-red-700 shadow-sm",
        outline:
          "border border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-900 text-slate-700 shadow-sm",
        secondary:
          "bg-brand-purpleLight text-brand-purple hover:bg-purple-100 border border-purple-200/50",
        ghost:
          "hover:bg-slate-100 text-slate-600 hover:text-slate-900",
        link:
          "text-brand-purple font-semibold underline-offset-4 hover:underline",
        ai:
          "bg-brand-purple text-white hover:bg-brand-purpleDark shadow-sm",
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
