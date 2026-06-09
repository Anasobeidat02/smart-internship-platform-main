"use client";

import { useI18n } from "@/components/providers/I18nProvider";
import { api } from "@/lib/api";
import type { InternshipWithCompany } from "@/lib/types";
import { useSavedInternships } from "@/lib/saved-store";
import { useQueries } from "@tanstack/react-query";
import { Briefcase, Clock, Heart, MapPin, Sparkles, Wifi } from "lucide-react";
import { Badge, Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonList } from "@/components/ui/Skeleton";
import Link from "next/link";
import { toList } from "@/lib/utils";

export default function SavedPage() {
  const { t, locale } = useI18n();
  const { ids, hydrated, toggle } = useSavedInternships();

  const results = useQueries({
    queries: ids.map((id) => ({
      queryKey: ["internship", id],
      queryFn: () => api<InternshipWithCompany>(`/internships/${id}`, { auth: false }),
      enabled: hydrated,
    })),
  });

  const loading = !hydrated || results.some((r) => r.isLoading);
  const items = results
    .map((r) => r.data)
    .filter((x): x is InternshipWithCompany => !!x);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-2">
        <Heart className="h-7 w-7 fill-rose-500 text-rose-500" />
        <h1 className="text-3xl font-bold tracking-tight">
          {locale === "ar" ? "التدريبات المحفوظة" : "Saved internships"}
        </h1>
      </div>
      <p className="mt-2 text-[rgb(var(--muted))]">
        {locale === "ar"
          ? "كل ما حفظته للاطلاع عليه لاحقاً، يبقى على هذا الجهاز."
          : "Everything you bookmarked for later - stored on this device."}
      </p>

      {loading ? (
        <div className="mt-8">
          <SkeletonList count={Math.min(ids.length || 3, 6)} />
        </div>
      ) : items.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<Heart className="h-6 w-6" />}
            title={locale === "ar" ? "لا توجد تدريبات محفوظة بعد" : "No saved internships yet"}
            description={
              locale === "ar"
                ? "اضغط على أيقونة القلب على بطاقة التدريب لحفظها هنا."
                : "Tap the heart on any internship card to save it here."
            }
            action={
              <Link href="/internships">
                <Button>{t.nav.internships}</Button>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => {
            const company = it.company;
            const title = locale === "ar" ? it.title_ar : it.title_en;
            const cname = locale === "ar" ? company.name_ar : company.name_en;
            return (
              <Card key={it.id} className="relative flex flex-col">
                <button
                  onClick={() => toggle(it.id)}
                  aria-label={locale === "ar" ? "إلغاء الحفظ" : "Unsave"}
                  className="absolute top-3 end-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[rgb(var(--background))]/60 backdrop-blur border border-[rgb(var(--border))]"
                >
                  <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />
                </button>
                <CardContent className="p-5 flex-1 flex flex-col">
                  <div className="flex items-start gap-3 pe-8">
                    <div
                      className={`flex-none h-11 w-11 rounded-xl bg-gradient-to-br ${
                        company.is_strategic_partner
                          ? "from-gold-500 to-gold-600"
                          : "from-brand-500 to-cyan-glow"
                      } flex items-center justify-center text-white`}
                    >
                      {company.is_strategic_partner ? <Sparkles className="h-5 w-5" /> : <Briefcase className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{title}</h3>
                      <p className="text-xs text-[rgb(var(--muted))] truncate">{cname}</p>
                      <p className="text-[11px] text-[rgb(var(--muted))] flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" />
                        {company.city}, {company.governorate}
                        {it.is_remote && (
                          <span className="ms-1 inline-flex items-center gap-0.5">
                            · <Wifi className="h-3 w-3" /> {locale === "ar" ? "عن بُعد" : "Remote"}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {toList(it.required_skills).slice(0, 3).map((s) => (
                      <Badge key={s} variant="cyan">{s}</Badge>
                    ))}
                  </div>
                  <div className="mt-3 text-[11px] text-[rgb(var(--muted))] inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {it.duration_weeks} {locale === "ar" ? "أسابيع" : "weeks"}
                  </div>
                  <div className="mt-auto pt-4">
                    <Link href={`/internships/${it.id}`}>
                      <Button size="sm" className="w-full">
                        {locale === "ar" ? "عرض التفاصيل" : "View details"}
                      </Button>
                    </Link>
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
