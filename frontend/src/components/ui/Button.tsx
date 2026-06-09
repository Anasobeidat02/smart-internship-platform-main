import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-r from-brand-600 via-brand-500 to-cyan-glow text-white shadow-[0_8px_30px_rgb(34,211,238,0.25)] hover:shadow-[0_12px_40px_rgb(34,211,238,0.4)] hover:-translate-y-0.5",
        secondary:
          "bg-white/10 text-white border border-white/20 backdrop-blur-md hover:bg-white/15",
        outline:
          "border border-[rgb(var(--border))] bg-transparent text-[rgb(var(--foreground))] hover:bg-[rgb(var(--surface))]",
        ghost:
          "text-[rgb(var(--foreground))] hover:bg-[rgb(var(--surface))]",
        gold:
          "bg-gradient-to-r from-gold-500 to-gold-600 text-brand-950 shadow-[0_8px_30px_rgb(245,184,0,0.35)] hover:shadow-[0_12px_40px_rgb(245,184,0,0.5)] hover:-translate-y-0.5",
        danger:
          "bg-red-600 text-white hover:bg-red-500",
      },
      size: {
        sm: "h-9 px-3.5",
        md: "h-11 px-5",
        lg: "h-13 px-7 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
);
Button.displayName = "Button";

export { buttonVariants };
