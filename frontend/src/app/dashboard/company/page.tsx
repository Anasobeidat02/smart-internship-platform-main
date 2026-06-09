"use client";

import { useI18n } from "@/components/providers/I18nProvider";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import type { Application, ApplicationStatus, Internship } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Briefcase,
  CheckCircle2,
  Clock,
  Loader2,
  RotateCcw,
  ThumbsDown,
  ThumbsUp,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";

const STATUS_CONFIG: Record<ApplicationStatus, { color: string; icon: typeof Clock; labelAr: string; labelEn: string }> = {
  pending:   { color: "text-amber-500 bg-amber-500/10",   icon: Clock,        labelAr: "قيد المراجعة", labelEn: "Pending" },
  accepted:  { color: "text-emerald-500 bg-emerald-500/10", icon: CheckCircle2, labelAr: "مقبول",       labelEn: "Accepted" },
  rejected:  { color: "text-red-500 bg-red-500/10",        icon: XCircle,      labelAr: "مرفوض",       labelEn: "Rejected" },
  withdrawn: { color: "text-zinc-400 bg-zinc-500/10",      icon: RotateCcw,    labelAr: "مسحوب",       labelEn: "Withdrawn" },
};

export default function CompanyApplicationsPage() {
  const { locale } = useI18n();
  const { user, hydrated } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();

  useEffect(() => {
    if (!hydrated) return;
    if (!user) router.replace("/login");
    else if (user.role !== "company" && user.role !== "admin") router.replace("/dashboard");
  }, [hydrated, user, router]);

  const { data: apps = [], isLoading } = useQuery({
    queryKey: ["company-applications"],
   queryFn: () => api<Application[]>("/applications/for-company"), 
    enabled: hydrated && (user?.role === "company" || user?.role === "admin"),
    refetchInterval: 30_000, // poll every 30s for live updates
  });

  const internshipIds = useMemo(() => Array.from(new Set(apps.map((a) => a.internship_id))), [apps]);

  const { data: internshipsMap } = useQuery({
    queryKey: ["internships-lookup", internshipIds],
    queryFn: async () => {
      const results = await Promise.all(
        internshipIds.map((id) =>
          api<Internship>(`/internships/${id}`, { auth: false }).catch(() => null)
        )
      );
      const map = new Map<number, Internship>();
      results.forEach((r) => { if (r) map.set(r.id, r); });
      return map;
    },
    enabled: internshipIds.length > 0,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "accepted" | "rejected" }) =>
      api<Application>(`/applications/${id}/status`, {
        method: "PATCH",
        body: { status },
      }),
    onSuccess: (updated) => {
      const label = updated.status === "accepted"
        ? (locale === "ar" ? "تم القبول ✅" : "Application accepted ✅")
        : (locale === "ar" ? "تم الرفض" : "Application rejected");
      toast.success(label);
      qc.invalidateQueries({ queryKey: ["company-applications"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!hydrated || !user) {
    return <div className="mx-auto max-w-5xl px-4 py-10"><div className="h-32 rounded-2xl bg-[rgb(var(--surface))] animate-pulse" /></div>;
  }

  const pending = apps.filter((a) => a.status === "pending");
  const reviewed = apps.filter((a) => a.status !== "pending");

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Briefcase className="h-7 w-7 text-cyan-glow" />
            {locale === "ar" ? "طلبات التدريب الواردة" : "Received Applications"}
          </h1>
          <p className="mt-2 text-[rgb(var(--muted))]">
            {locale === "ar"
              ? "راجع طلبات الطلاب وقرّر قبولهم أو رفضهم"
              : "Review student applications and accept or reject them"}
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="rounded-full bg-amber-500/10 text-amber-500 px-3 py-1 font-semibold">
            {pending.length} {locale === "ar" ? "قيد الانتظار" : "pending"}
          </span>
          <span className="rounded-full bg-[rgb(var(--surface))] text-[rgb(var(--muted))] border border-[rgb(var(--border))] px-3 py-1">
            {apps.length} {locale === "ar" ? "إجمالي" : "total"}
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-8 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-[rgb(var(--surface))] animate-pulse" />
          ))}
        </div>
      ) : apps.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="p-10 text-center">
            <Briefcase className="h-10 w-10 mx-auto text-[rgb(var(--muted))]" />
            <h2 className="mt-3 font-semibold">
              {locale === "ar" ? "لا توجد طلبات حتى الآن" : "No applications yet"}
            </h2>
            <p className="text-sm text-[rgb(var(--muted))] mt-1">
              {locale === "ar"
                ? "ستظهر طلبات الطلاب هنا عند تقديمهم"
                : "Student applications will appear here once submitted."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 space-y-8">
          {/* Pending section */}
          {pending.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-500 mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {locale === "ar" ? "بانتظار القرار" : "Awaiting Decision"} ({pending.length})
              </h2>
              <div className="space-y-3">
                {pending.map((app) => (
                  <ApplicationCard
                    key={app.id}
                    app={app}
                    internship={internshipsMap?.get(app.internship_id)}
                    locale={locale}
                    onAccept={() => statusMutation.mutate({ id: app.id, status: "accepted" })}
                    onReject={() => statusMutation.mutate({ id: app.id, status: "rejected" })}
                    isPending={statusMutation.isPending}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Reviewed section */}
          {reviewed.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[rgb(var(--muted))] mb-3">
                {locale === "ar" ? "تم مراجعتها" : "Reviewed"} ({reviewed.length})
              </h2>
              <div className="space-y-3">
                {reviewed.map((app) => (
                  <ApplicationCard
                    key={app.id}
                    app={app}
                    internship={internshipsMap?.get(app.internship_id)}
                    locale={locale}
                    readonly
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function ApplicationCard({
  app,
  internship,
  locale,
  onAccept,
  onReject,
  isPending,
  readonly = false,
}: {
  app: Application;
  internship: Internship | undefined;
  locale: string;
  onAccept?: () => void;
  onReject?: () => void;
  isPending?: boolean;
  readonly?: boolean;
}) {
  const cfg = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  const title = internship
    ? (locale === "ar" ? internship.title_ar : internship.title_en)
    : `Internship #${app.internship_id}`;

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold">{title}</h3>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}>
                <Icon className="h-3 w-3" />
                {locale === "ar" ? cfg.labelAr : cfg.labelEn}
              </span>
            </div>
            <p className="text-xs text-[rgb(var(--muted))] mt-1">
              {locale === "ar" ? "نسبة المطابقة" : "Match"}: {Math.round(app.match_score)}%
              {app.created_at && ` · ${new Date(app.created_at).toLocaleDateString()}`}
            </p>
            {app.cover_letter && (
              <details className="mt-2 text-sm">
                <summary className="cursor-pointer text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))]">
                  {locale === "ar" ? "عرض خطاب التغطية" : "Show cover letter"}
                </summary>
                <p className="mt-2 whitespace-pre-line text-[rgb(var(--muted))] rounded-lg bg-[rgb(var(--surface))] p-3 text-xs leading-relaxed">
                  {app.cover_letter}
                </p>
              </details>
            )}
          </div>

          {!readonly && app.status === "pending" && (
            <div className="flex items-center gap-2 flex-none">
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={onReject}
                className="border-red-500/40 text-red-500 hover:bg-red-500/10"
                id={`btn-reject-${app.id}`}
              >
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ThumbsDown className="h-3.5 w-3.5" />}
                {locale === "ar" ? "رفض" : "Reject"}
              </Button>
              <Button
                size="sm"
                disabled={isPending}
                onClick={onAccept}
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
                id={`btn-accept-${app.id}`}
              >
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ThumbsUp className="h-3.5 w-3.5" />}
                {locale === "ar" ? "قبول" : "Accept"}
              </Button>
            </div>
          )}

          <div className="flex items-center gap-2 flex-none">
            <Link href={`/internships/${app.internship_id}`}>
              <Button variant="outline" size="sm">
                {locale === "ar" ? "عرض" : "View"}
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
