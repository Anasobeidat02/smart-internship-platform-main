"use client";

import { PageHeader } from "@/components/admin/AdminTable";
import { api } from "@/lib/api";
import type { AdminStats } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  GraduationCap,
  School2,
  Users,
  Briefcase,
  ScrollText,
  Star,
  CheckCircle2,
} from "lucide-react";

const TILES = [
  { key: "users", label: "Users", icon: Users, color: "from-cyan-500 to-blue-500" },
  { key: "students", label: "Students", icon: GraduationCap, color: "from-emerald-500 to-teal-500" },
  { key: "companies", label: "Corporates", icon: Building2, color: "from-violet-500 to-purple-500" },
  { key: "universities", label: "Institutes", icon: School2, color: "from-amber-500 to-orange-500" },
  { key: "internships", label: "Internships", icon: Briefcase, color: "from-pink-500 to-rose-500" },
  { key: "applications", label: "Applications", icon: ScrollText, color: "from-indigo-500 to-blue-600" },
  { key: "strategic_partners", label: "Strategic partners", icon: Star, color: "from-yellow-500 to-amber-600" },
  { key: "active_users", label: "Active users", icon: CheckCircle2, color: "from-green-500 to-emerald-600" },
] as const;

export default function AdminOverviewPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => api<AdminStats>("/admin/stats"),
  });

  return (
    <div>
      <PageHeader
        title="Overview"
        subtitle="Platform-wide statistics and quick links"
      />

      {error && (
        <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
          Failed to load stats: {(error as Error).message}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TILES.map((t) => {
          const value = data?.[t.key as keyof AdminStats];
          return (
            <div
              key={t.key}
              className="relative overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5"
            >
              <div
                className={`absolute -top-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br ${t.color} opacity-20 blur-2xl`}
              />
              <div className="relative flex items-start justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">
                    {t.label}
                  </div>
                  <div className="mt-2 text-3xl font-bold tabular-nums">
                    {isLoading ? "-" : (value ?? 0)}
                  </div>
                </div>
                <div
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${t.color} text-white shadow-lg`}
                >
                  <t.icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5 text-sm">
        <h2 className="font-semibold mb-2">Quick guidance</h2>
        <ul className="list-disc ms-5 space-y-1 text-[rgb(var(--muted))]">
          <li>Use the sidebar to manage users, students, corporates, institutes, internships and applications.</li>
          <li>Deletes cascade safely (e.g. removing a corporate also removes its internships and applications).</li>
          <li>Deleting an institute detaches students rather than removing them.</li>
        </ul>
      </div>
    </div>
  );
}
