"use client";

import dynamic from "next/dynamic";
import { useI18n } from "@/components/providers/I18nProvider";
import { Badge, Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import type { RecommendationOut } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Building2, MapPin, Sparkles, TrendingUp, Compass, AlertCircle, Navigation, Briefcase } from "lucide-react";
import { formatKm, formatScore, googleMapsSearchUrl, googleMapsDirectionsUrl } from "@/lib/utils";
import { motion } from "framer-motion";
import Link from "next/link";
import { ProfileCompleteness } from "@/components/dashboard/ProfileCompleteness";
import { useAuth } from "@/lib/auth-store";

const JordanMap = dynamic(
  () => import("@/components/map/JordanMap").then((m) => m.JordanMap),
  { ssr: false, loading: () => <div className="h-full w-full bg-[rgb(var(--surface))] animate-pulse rounded-2xl" /> }
);

export default function DashboardHome() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const [focusOn, setFocusOn] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const isStudent = user?.role === "student";
  const { data, isLoading, error } = useQuery({
    queryKey: ["recommendations"],
    queryFn: () => api<RecommendationOut>("/recommendations/me"),
    enabled: isStudent,
  });

  const markers = useMemo(() => {
    if (!data) return [] as Array<{ id: string; lat: number; lng: number; label: string; kind: "company" | "strategic" | "home" | "university"; meta?: Record<string, unknown> }>;
    const list: Array<{ id: string; lat: number; lng: number; label: string; kind: "company" | "strategic" | "home" | "university"; meta?: Record<string, unknown> }> = data.items.map((it, idx) => ({
      id: `c-${it.company.id}`,
      lat: it.company.latitude,
      lng: it.company.longitude,
      label: `${idx + 1}. ${locale === "ar" ? it.company.name_ar : it.company.name_en}`,
      kind: it.company.is_strategic_partner ? "strategic" : "company",
      meta: { companyId: it.company.id },
    }));
    if (data.student_home) {
      list.unshift({
        id: "home",
        lat: data.student_home.lat,
        lng: data.student_home.lng,
        label: locale === "ar" ? "موقع سكنك" : "Your home",
        kind: "home",
        meta: { companyId: -1 },
      });
    }
    return list;
  }, [data, locale]);

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold">{t.dashboard.complete_profile}</h2>
          <p className="text-sm text-[rgb(var(--muted))] mt-2">{(error as Error).message}</p>
          <Link href="/dashboard/profile" className="mt-4 inline-block">
            <Button>{t.profile.title}</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const items = data?.items ?? [];
  const top = items[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Compass className="h-6 w-6 text-cyan-glow" />
          {t.dashboard.your_matches}
        </h1>
        <p className="text-sm text-[rgb(var(--muted))] mt-1">
          {locale === "ar"
            ? "توصيات شخصية مرتّبة حسب المهارات والموقع والمجال"
            : "Personalised recommendations ranked by skills, location, and field."}
        </p>
      </div>

      <ProfileCompleteness />

      {top && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl border border-gold-500/30 bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 p-6 text-white shadow-xl"
        >
          <div className="absolute -top-12 -end-12 h-48 w-48 rounded-full bg-gold-500/20 blur-3xl" />
          <div className="relative flex flex-wrap items-start gap-4">
            <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${top.company.is_strategic_partner ? "from-gold-500 to-gold-600" : "from-brand-500 to-cyan-glow"} flex items-center justify-center`}>
              {top.company.is_strategic_partner ? <Sparkles className="h-7 w-7" /> : <Building2 className="h-7 w-7" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="gold">{t.dashboard.best_match}</Badge>
                {top.company.is_strategic_partner && <Badge variant="gold">{t.partner.kicker}</Badge>}
              </div>
              <h2 className="mt-2 text-xl font-bold">{locale === "ar" ? top.company.name_ar : top.company.name_en}</h2>
              <p className="text-sm text-brand-100 flex items-center gap-1 mt-1">
                <MapPin className="h-3.5 w-3.5" /> {top.company.city}, {top.company.governorate} · {formatKm(top.distance_km)}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {top.reasons.map((r) => (
                  <span key={r} className="text-xs bg-white/10 border border-white/20 rounded-full px-2 py-0.5">
                    {r}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right flex flex-col items-end">
              <div className="text-4xl font-bold bg-gradient-to-r from-gold-300 to-gold-500 bg-clip-text text-transparent">
                {formatScore(top.score)}
              </div>
              <div className="text-xs text-brand-200 uppercase tracking-wider">{t.dashboard.match_score}</div>
              <div className="mt-3 flex flex-wrap gap-2 justify-end w-full sm:w-auto">
                <Link
                  href={top.internship ? `/internships/${top.internship.id}` : `/internships?q=${encodeURIComponent(locale === "ar" ? top.company.name_ar : top.company.name_en)}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gold-500 hover:bg-gold-600 px-3 py-1.5 text-xs font-bold text-brand-950 shadow-md transition-all hover:scale-105"
                >
                  <Briefcase className="h-3.5 w-3.5" />
                  {locale === "ar" ? "عرض وتطبيق" : "View & Apply"}
                </Link>
                <a
                  href={googleMapsDirectionsUrl(
                    {
                      name: top.company.name_en,
                      address: top.company.address,
                      city: top.company.city,
                      governorate: top.company.governorate,
                      latitude: top.company.latitude,
                      longitude: top.company.longitude,
                    },
                    data?.student_home ? { lat: data.student_home.lat, lng: data.student_home.lng } : null
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-semibold text-white border border-white/15 transition-all"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  {locale === "ar" ? "الاتجاهات" : "Get directions"}
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="h-[480px] rounded-2xl border border-[rgb(var(--border))] overflow-hidden">
          <JordanMap
            markers={markers}
            focusOn={focusOn}
            onMarkerClick={(m) => {
              const cid = (m.meta as { companyId?: number })?.companyId;
              if (cid && cid > 0) setSelectedId(cid);
            }}
          />
        </div>

        <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1 no-scrollbar">
          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-24 rounded-xl bg-[rgb(var(--surface))] animate-pulse" />
              ))}
            </div>
          )}
          {items.map((it, idx) => (
            <button
              key={it.company.id}
              onClick={() => {
                setFocusOn({ lat: it.company.latitude, lng: it.company.longitude, zoom: 12 });
                setSelectedId(it.company.id);
              }}
              className={`w-full text-start rounded-xl border p-4 transition-all ${
                selectedId === it.company.id
                  ? "border-cyan-glow bg-cyan-glow/5"
                  : "border-[rgb(var(--border))] bg-[rgb(var(--surface))] hover:border-cyan-glow/50"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`flex-none h-9 w-9 rounded-lg bg-gradient-to-br ${it.company.is_strategic_partner ? "from-gold-500 to-gold-600" : "from-brand-500 to-cyan-glow"} text-white flex items-center justify-center text-sm font-bold`}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-semibold text-sm truncate">{locale === "ar" ? it.company.name_ar : it.company.name_en}</h3>
                    {it.company.is_strategic_partner && <Sparkles className="h-3.5 w-3.5 text-gold-500 flex-none" />}
                  </div>
                  <p className="text-[11px] text-[rgb(var(--muted))] flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {it.company.city} · {formatKm(it.distance_km)}
                  </p>
                </div>
                <div className="text-right flex-none">
                  <div className="text-base font-bold gradient-text">{formatScore(it.score)}</div>
                  <TrendingUp className="h-3 w-3 text-[rgb(var(--muted))] inline" />
                </div>
              </div>
              {selectedId === it.company.id && (
                <div className="mt-3 pt-3 border-t border-[rgb(var(--border))] space-y-2">
                  <div className="text-xs text-[rgb(var(--muted))]">{t.dashboard.reasons}:</div>
                  <ul className="space-y-1">
                    {it.reasons.map((r) => (
                      <li key={r} className="text-xs flex items-start gap-1.5">
                        <span className="text-cyan-glow mt-0.5">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="grid grid-cols-3 gap-1 mt-2">
                    {Object.entries(it.breakdown).map(([k, v]) => (
                      <div key={k} className="text-[10px]">
                        <div className="text-[rgb(var(--muted))] uppercase tracking-wider">{k}</div>
                        <div className="font-semibold">{v.toFixed(1)}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Link
                      href={it.internship ? `/internships/${it.internship.id}` : `/internships?q=${encodeURIComponent(locale === "ar" ? it.company.name_ar : it.company.name_en)}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-gold-500 hover:bg-gold-600 px-2.5 py-1.5 text-[11px] font-bold text-brand-950 shadow-sm transition-all hover:scale-105"
                    >
                      <Briefcase className="h-3 w-3" />
                      {locale === "ar" ? "عرض وتطبيق" : "View & Apply"}
                    </Link>
                    <a
                      href={googleMapsSearchUrl({
                        name: it.company.name_en,
                        address: it.company.address,
                        city: it.company.city,
                        governorate: it.company.governorate,
                        latitude: it.company.latitude,
                        longitude: it.company.longitude,
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-[rgb(var(--surface))]/80 border border-[rgb(var(--border))] px-2.5 py-1.5 text-[11px] font-semibold text-[rgb(var(--muted))] hover:text-white hover:bg-[rgb(var(--surface))]"
                    >
                      <MapPin className="h-3 w-3" />
                      {locale === "ar" ? "خرائط" : "Maps"}
                    </a>
                    <a
                      href={googleMapsDirectionsUrl(
                        {
                          name: it.company.name_en,
                          address: it.company.address,
                          city: it.company.city,
                          governorate: it.company.governorate,
                          latitude: it.company.latitude,
                          longitude: it.company.longitude,
                        },
                        data?.student_home ? { lat: data.student_home.lat, lng: data.student_home.lng } : null
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-[rgb(var(--border))] px-2.5 py-1.5 text-[11px] font-semibold text-[rgb(var(--muted))] hover:text-white hover:bg-[rgb(var(--surface))]"
                    >
                      <Navigation className="h-3 w-3" />
                      {locale === "ar" ? "اتجاهات" : "Directions"}
                    </a>
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
