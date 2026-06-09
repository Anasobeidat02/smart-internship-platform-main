import { cn } from "@/lib/utils";
import * as React from "react";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-11 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-4 text-sm",
      "placeholder:text-[rgb(var(--muted))] focus:border-cyan-glow focus:outline-none focus:ring-2 focus:ring-cyan-glow/30",
      "transition-colors",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-24 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-4 py-3 text-sm",
      "placeholder:text-[rgb(var(--muted))] focus:border-cyan-glow focus:outline-none focus:ring-2 focus:ring-cyan-glow/30",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "h-11 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-4 text-sm",
      "focus:border-cyan-glow focus:outline-none focus:ring-2 focus:ring-cyan-glow/30",
      className
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("block text-xs font-medium uppercase tracking-wide text-[rgb(var(--muted))] mb-1.5", className)}
      {...props}
    />
  );
}
