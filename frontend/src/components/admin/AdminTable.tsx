"use client";

import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import * as React from "react";

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
  searchable?: boolean;
  accessor?: (row: T) => string | number | null | undefined;
}

interface AdminTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string | number;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

export function AdminTable<T>({
  rows,
  columns,
  rowKey,
  searchPlaceholder = "Search…",
  emptyMessage = "No records found",
}: AdminTableProps<T>) {
  const [q, setQ] = React.useState("");

  const filtered = React.useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    const searchables = columns.filter((c) => c.searchable !== false);
    return rows.filter((row) =>
      searchables.some((c) => {
        const v = c.accessor ? c.accessor(row) : (row as Record<string, unknown>)[c.key];
        return v != null && String(v).toLowerCase().includes(term);
      })
    );
  }, [q, rows, columns]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgb(var(--muted))]" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] pl-9 pr-3 text-sm focus:border-cyan-glow focus:outline-none focus:ring-2 focus:ring-cyan-glow/30"
          />
        </div>
        <div className="text-xs text-[rgb(var(--muted))]">
          {filtered.length} / {rows.length}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
        <table className="w-full text-sm">
          <thead className="bg-[rgb(var(--background))]/60">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={cn(
                    "text-start px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted))]",
                    c.className
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-sm text-[rgb(var(--muted))]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr
                  key={rowKey(row)}
                  className="border-t border-[rgb(var(--border))] hover:bg-[rgb(var(--background))]/40"
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cn("px-4 py-3 align-middle", c.className)}
                    >
                      {c.render
                        ? c.render(row)
                        : ((row as Record<string, unknown>)[c.key] as React.ReactNode) ?? "-"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "success" | "warn" | "danger" | "info";
}) {
  const toneCls = {
    default: "bg-[rgb(var(--background))] text-[rgb(var(--muted))] border-[rgb(var(--border))]",
    success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    warn: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
    danger: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30",
    info: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
  }[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        toneCls
      )}
    >
      {children}
    </span>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-sm text-[rgb(var(--muted))] mt-1">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export async function confirmAction(message: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  return window.confirm(message);
}
