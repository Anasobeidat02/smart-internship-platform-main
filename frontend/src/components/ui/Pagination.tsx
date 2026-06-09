"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  page: number;
  pageSize: number;
  total?: number;
  hasMore?: boolean;
  onPageChange: (p: number) => void;
  className?: string;
  rtl?: boolean;
  labels?: { prev?: string; next?: string; page?: string; of?: string };
}

export function Pagination({
  page,
  pageSize,
  total,
  hasMore,
  onPageChange,
  className,
  rtl,
  labels,
}: PaginationProps) {
  const totalPages = total != null ? Math.max(1, Math.ceil(total / pageSize)) : null;
  const canPrev = page > 1;
  const canNext = totalPages != null ? page < totalPages : !!hasMore;
  const lbl = { prev: "Previous", next: "Next", page: "Page", of: "of", ...labels };

  const PrevIcon = rtl ? ChevronRight : ChevronLeft;
  const NextIcon = rtl ? ChevronLeft : ChevronRight;

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex items-center justify-center gap-2", className)}
    >
      <button
        type="button"
        onClick={() => canPrev && onPageChange(page - 1)}
        disabled={!canPrev}
        className="inline-flex items-center gap-1 rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-sm font-semibold hover:bg-[rgb(var(--surface))] disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/40"
      >
        <PrevIcon className="h-4 w-4" />
        <span className="hidden sm:inline">{lbl.prev}</span>
      </button>
      <span className="text-sm text-[rgb(var(--muted))] px-2" aria-live="polite">
        {lbl.page} <strong className="text-[rgb(var(--foreground))]">{page}</strong>
        {totalPages != null && (
          <> {lbl.of} <strong className="text-[rgb(var(--foreground))]">{totalPages}</strong></>
        )}
      </span>
      <button
        type="button"
        onClick={() => canNext && onPageChange(page + 1)}
        disabled={!canNext}
        className="inline-flex items-center gap-1 rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-sm font-semibold hover:bg-[rgb(var(--surface))] disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/40"
      >
        <span className="hidden sm:inline">{lbl.next}</span>
        <NextIcon className="h-4 w-4" />
      </button>
    </nav>
  );
}
