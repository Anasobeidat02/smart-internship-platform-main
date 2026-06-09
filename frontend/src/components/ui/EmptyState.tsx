"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--surface))]/40 p-10 text-center flex flex-col items-center gap-3",
        className,
      )}
    >
      {icon && (
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500/15 to-cyan-glow/10 text-cyan-glow">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-bold">{title}</h3>
      {description && (
        <p className="text-sm text-[rgb(var(--muted))] max-w-md leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
