"use client";

import { useI18n } from "@/components/providers/I18nProvider";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import type { Application, ApplicationStatus, Internship } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Briefcase, CheckCircle2, Clock, XCircle, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";

const STATUS_CONFIG: Record<ApplicationStatus, { color: string; icon: typeof Clock; label_en: string; label_ar: string }> = {
  pending:   { color: "bg-amber-500/10 text-amber-600 dark:text-amber-300",       icon: Clock,        label_en: "Pending",   label_ar: "قيد المراجعة" },
  accepted:  { color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300", icon: CheckCircle2, label_en: "Accepted",  label_ar: "مقبول" },
  rejected:  { color: "bg-red-500/10 text-red-600 dark:text-red-300",             icon: XCircle,      label_en: "Rejected",  label_ar: "مرفوض" },
  withdrawn: { color: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-300",          icon: RotateCcw,    label_en: "Withdrawn", label_ar: "مسحوب" },
};

export default function ApplicationsPage() {
  const { t, locale } = useI18n();
  const { user, hydrated } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();

  useEffect(() => {
    if (!hydrated) return;
    if (!user) router.replace("/login");
    else if (user.role !== "student") router.replace("/dashboard");
  }, [hydrated, user, router]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["my-applications"],
    queryFn: () => api<Application[]>("/applications/mine"),
    enabled: hydrated && user?.role === "student",
  });

  const internshipIds = useMemo(
    () => Array.from(new Set((data ?? []).map((a) => a.internship_id))),
    [data]
  );

  const { data: internships } = useQuery({
    queryKey: ["internships-lookup", internshipIds],
    queryFn: async () => {
      const results = await Promise.all(
        internshipIds.map((id) => api<Internship>(`/internships/${id}`, { auth: false }).catch(() => null))
      );
      const map = new Map<number, Internship>();
      results.forEach((r) => { if (r) map.set(r.id, r); });
      return map;
    },
    enabled: internshipIds.length > 0,
  });

  const withdraw = useMutation({
    mutationFn: (id: number) => api<Application>(`/applications/${id}/withdraw`, { method: "PATCH" }),
    onSuccess: () => {
      toast.success(locale === "ar" ? "تم سحب الطلب" : "Application withdrawn");
      qc.invalidateQueries({ queryKey: ["my-applications"] });
    },
    onError: (e: Error) => {
      const msg = e instanceof ApiError && typeof e.detail === "object" && e.detail && "detail" in e.detail
        ? String((e.detail as { detail: unknown }).detail)
        : e.message;
      toast.error(msg);
    },
  });

  if (!hydrated || !user || user.role !== "student") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="h-32 rounded-2xl bg-[rgb(var(--surface))] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
        <Briefcase className="h-7 w-7 text-cyan-glow" />
        {t.nav.applications}
      </h1>
      <p className="mt-2 text-[rgb(var(--muted))]">
        {locale === "ar" ? "تابع كل طلباتك في مكان واحد" : "Track every application you've sent in one place"}
      </p>

      {error && (
        <Card className="mt-6">
          <CardContent className="p-6 text-sm text-red-500">{(error as Error).message}</CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="mt-8 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-[rgb(var(--surface))] animate-pulse" />
          ))}
        </div>
      ) : (data ?? []).length === 0 ? (
        <Card className="mt-8">
          <CardContent className="p-10 text-center">
            <Briefcase className="h-10 w-10 mx-auto text-[rgb(var(--muted))]" />
            <h2 className="mt-3 font-semibold">
              {locale === "ar" ? "لم تقدّم بعد على أي تدريب" : "You haven't applied to any internship yet"}
            </h2>
            <p className="text-sm text-[rgb(var(--muted))] mt-1">
              {locale === "ar" ? "تصفّح الفرص وابدأ التقديم" : "Browse opportunities and start applying."}
            </p>
            <Link href="/internships" className="mt-4 inline-block">
              <Button>{locale === "ar" ? "تصفّح الفرص" : "Browse internships"}</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 space-y-3">
          {(data ?? []).map((app) => {
            const status = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.pending;
            const Icon = status.icon;
            const internship = internships?.get(app.internship_id);
            const title = internship
              ? (locale === "ar" ? internship.title_ar : internship.title_en)
              : `Internship #${app.internship_id}`;
            const canWithdraw = app.status === "pending";
            return (
              <Card key={app.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold truncate">{title}</h3>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}>
                          <Icon className="h-3 w-3" />
                          {locale === "ar" ? status.label_ar : status.label_en}
                        </span>
                      </div>
                      <p className="text-xs text-[rgb(var(--muted))] mt-1">
                        {locale === "ar" ? "نسبة المطابقة" : "Match score"}: {Math.round(app.match_score)}%
                        {app.created_at && ` · ${new Date(app.created_at).toLocaleDateString()}`}
                      </p>
                      {app.cover_letter && (
                        <details className="mt-2 text-sm">
                          <summary className="cursor-pointer text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))]">
                            {locale === "ar" ? "عرض خطاب التغطية" : "Show cover letter"}
                          </summary>
                          <p className="mt-2 whitespace-pre-line text-[rgb(var(--muted))] rounded-lg bg-[rgb(var(--surface))] p-3">
                            {app.cover_letter}
                          </p>
                        </details>
                      )}
                    </div>
                    <div className="flex flex-none items-center gap-2">
                      <Link href={`/internships/${app.internship_id}`}>
                        <Button variant="outline" size="sm">{locale === "ar" ? "عرض" : "View"}</Button>
                      </Link>
                      {canWithdraw && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={withdraw.isPending}
                          onClick={() => {
                            if (confirm(locale === "ar" ? "هل تريد سحب الطلب؟" : "Withdraw this application?")) {
                              withdraw.mutate(app.id);
                            }
                          }}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          {locale === "ar" ? "سحب" : "Withdraw"}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
