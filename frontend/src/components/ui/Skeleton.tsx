"use client";

import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-[rgb(var(--surface))] border border-[rgb(var(--border))]",
        className,
      )}
    />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))]/60 p-6 space-y-3 animate-pulse",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-[rgb(var(--background))]" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-2/3 rounded bg-[rgb(var(--background))]" />
          <div className="h-2 w-1/3 rounded bg-[rgb(var(--background))]" />
        </div>
      </div>
      <div className="space-y-2 pt-2">
        <div className="h-2 w-full rounded bg-[rgb(var(--background))]" />
        <div className="h-2 w-5/6 rounded bg-[rgb(var(--background))]" />
        <div className="h-2 w-4/6 rounded bg-[rgb(var(--background))]" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
