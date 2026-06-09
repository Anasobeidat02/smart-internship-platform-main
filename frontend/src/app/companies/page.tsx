"use client";

import { useI18n } from "@/components/providers/I18nProvider";
import { api } from "@/lib/api";
import type { Company } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { Badge, Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SkeletonList } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { Building2, MapPin, Search, Sparkles, Navigation, Globe2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toList, googleMapsSearchUrl, googleEarthUrl } from "@/lib/utils";

const PAGE_SIZE = 12;

export default function CompaniesPage() {
  const { t, locale } = useI18n();
  const [q, setQ] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [strategic, setStrategic] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["companies-all"],
    queryFn: () => api<Company[]>("/companies/", { auth: false, query: { limit: 200 } }),
  });

  const governorates = useMemo(() => {
    const set = new Set<string>();
    data?.forEach((c) => set.add(c.governorate));
    return Array.from(set).sort();
  }, [data]);

  const filtered = useMemo(() => {
    return (data ?? []).filter((c) => {
      if (strategic && !c.is_strategic_partner) return false;
      if (governorate && c.governorate !== governorate) return false;
      if (q) {
        const needle = q.toLowerCase();
        const hay = `${c.name_en} ${c.name_ar} ${c.industry ?? ""} ${toList(c.training_fields).join(" ")}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [data, q, governorate, strategic]);

  const total = filtered.length;
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasActive = !!q || !!governorate || strategic;
  const clearAll = () => {
    setQ("");
    setGovernorate("");
    setStrategic(false);
    setPage(1);
  };
  const fmt = new Intl.NumberFormat(locale === "ar" ? "ar-JO" : "en-US");

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold tracking-tight">{t.nav.companies}</h1>
      <p className="mt-2 text-[rgb(var(--muted))]">
        {locale === "ar" ? "تصفّح كل الشركات الشريكة في المملكة" : "Browse every partner company across the Kingdom"}
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_220px_auto]">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgb(var(--muted))]" />
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder={locale === "ar" ? "ابحث عن شركة..." : "Search companies..."}
            className="ps-10"
            aria-label={locale === "ar" ? "ابحث" : "Search"}
          />
        </div>
        <select
          value={governorate}
          onChange={(e) => {
            setGovernorate(e.target.value);
            setPage(1);
          }}
          className="h-11 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-glow/40"
          aria-label={t.map.filter_gov}
        >
          <option value="">{t.map.all_governorates}</option>
          {governorates.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <label className="inline-flex items-center gap-2 px-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] cursor-pointer text-sm">
          <input type="checkbox" className="accent-gold-500" checked={strategic} onChange={(e) => { setStrategic(e.target.checked); setPage(1); }} />
          <Sparkles className="h-4 w-4 text-gold-500" />
          {t.map.filter_strategic}
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-[rgb(var(--muted))]">
          {fmt.format(total)} {locale === "ar" ? "شركة" : "companies"}
        </span>
        {q && <Chip onClear={() => setQ("")}>{q}</Chip>}
        {governorate && <Chip onClear={() => setGovernorate("")}>{governorate}</Chip>}
        {strategic && <Chip onClear={() => setStrategic(false)}>{t.partner.kicker}</Chip>}
        {hasActive && (
          <button
            onClick={clearAll}
            className="ms-auto inline-flex items-center gap-1 rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-[11px] font-semibold text-[rgb(var(--muted))] hover:bg-[rgb(var(--surface))]"
          >
            <X className="h-3 w-3" />
            {locale === "ar" ? "مسح الكل" : "Clear all"}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="mt-8"><SkeletonList count={6} /></div>
      ) : total === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<Building2 className="h-6 w-6" />}
            title={locale === "ar" ? "لا توجد شركات مطابقة" : "No companies match"}
            description={locale === "ar" ? "جرّب تغيير التصفية." : "Try changing your filters."}
            action={hasActive ? <Button variant="outline" size="sm" onClick={clearAll}>{locale === "ar" ? "مسح الكل" : "Clear all"}</Button> : null}
          />
        </div>
      ) : (
        <>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pageItems.map((c) => (
            <Card key={c.id} className="group hover:border-cyan-glow/40 hover:shadow-[0_8px_30px_rgba(34,211,238,0.12)] transition-all">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className={`flex-none h-11 w-11 rounded-xl bg-gradient-to-br ${c.is_strategic_partner ? "from-gold-500 to-gold-600" : "from-brand-500 to-cyan-glow"} flex items-center justify-center text-white`}>
                    {c.is_strategic_partner ? <Sparkles className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold truncate">{locale === "ar" ? c.name_ar : c.name_en}</h3>
                      {c.is_strategic_partner && <Badge variant="gold">{t.partner.kicker}</Badge>}
                    </div>
                    <p className="text-xs text-[rgb(var(--muted))] flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" />
                      {c.city}, {c.governorate}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-[rgb(var(--muted))] line-clamp-3">
                  {locale === "ar" ? c.description_ar : c.description_en}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {toList(c.training_fields).slice(0, 4).map((f) => (
                    <Badge key={f} variant="cyan">{f}</Badge>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between gap-2 pt-3 border-t border-[rgb(var(--border))]">
                  <span className="text-[11px] text-[rgb(var(--muted))] truncate" title={c.address ?? undefined}>
                    {c.address ?? `${c.city}, ${c.governorate}`}
                  </span>
                  <div className="flex flex-none items-center gap-1.5">
                    <a
                      href={googleEarthUrl({
                        name: c.name_en,
                        address: c.address,
                        city: c.city,
                        governorate: c.governorate,
                        latitude: c.latitude,
                        longitude: c.longitude,
                      }, c.is_strategic_partner ? 400 : 650)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-cyan-500 to-sky-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:opacity-90"
                      title={t.map.open_satellite}
                    >
                      <Globe2 className="h-3 w-3" />
                      {t.nav.map}
                    </a>
                    <a
                      href={googleMapsSearchUrl({
                        name: c.name_en,
                        address: c.address,
                        city: c.city,
                        governorate: c.governorate,
                        latitude: c.latitude,
                        longitude: c.longitude,
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 rounded-lg border border-[rgb(var(--border))] px-2.5 py-1 text-[11px] font-semibold hover:bg-[rgb(var(--surface))]"
                      title="Open in Google Maps"
                    >
                      <Navigation className="h-3 w-3" />
                      Maps
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-8">
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            rtl={locale === "ar"}
            labels={{
              prev: locale === "ar" ? "السابق" : "Previous",
              next: locale === "ar" ? "التالي" : "Next",
              page: locale === "ar" ? "صفحة" : "Page",
              of: locale === "ar" ? "من" : "of",
            }}
          />
        </div>
        </>
      )}
    </div>
  );
}

function Chip({ children, onClear }: { children: React.ReactNode; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-cyan-glow/10 text-cyan-300 border border-cyan-glow/30 px-2.5 py-1 text-[11px]">
      {children}
      <button onClick={onClear} className="rounded-full hover:bg-cyan-glow/20 p-0.5" aria-label="Remove filter">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
