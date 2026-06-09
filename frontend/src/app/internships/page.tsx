"use client";

import { useI18n } from "@/components/providers/I18nProvider";
import { Badge, Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { SkeletonList } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { api } from "@/lib/api";
import type { InternshipWithCompany } from "@/lib/types";
import { googleEarthUrl, googleMapsSearchUrl, toList } from "@/lib/utils";
import { useSavedInternships } from "@/lib/saved-store";
import { useQuery } from "@tanstack/react-query";
import {
  Briefcase,
  Clock,
  Globe2,
  Heart,
  MapPin,
  Navigation,
  Search,
  Sparkles,
  Wifi,
  X,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type Sort = "newest" | "shortest" | "longest" | "name";
const PAGE_SIZE = 12;

export default function InternshipsBrowsePage() {
  const { t, locale } = useI18n();
  const [q, setQ] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("newest");
  const [page, setPage] = useState(1);
  const { isSaved, toggle: toggleSaved } = useSavedInternships();

  const { data, isLoading, error } = useQuery({
    queryKey: ["internships-all"],
    queryFn: () =>
      api<InternshipWithCompany[]>("/internships/", {
        auth: false,
        query: { limit: 200 },
      }),
  });

  const governorates = useMemo(() => {
    const s = new Set<string>();
    data?.forEach((it) => s.add(it.company.governorate));
    return Array.from(s).sort();
  }, [data]);

  const filtered = useMemo(() => {
    let arr = (data ?? []).filter((it) => {
      if (remoteOnly && !it.is_remote) return false;
      if (governorate && it.company.governorate !== governorate) return false;
      if (savedOnly && !isSaved(it.id)) return false;
      if (q) {
        const n = q.toLowerCase();
        const hay = `${it.title_en} ${it.title_ar} ${it.company.name_en} ${it.company.name_ar} ${it.required_skills}`.toLowerCase();
        if (!hay.includes(n)) return false;
      }
      return true;
    });
    arr = [...arr].sort((a, b) => {
      switch (sort) {
        case "shortest":
          return a.duration_weeks - b.duration_weeks;
        case "longest":
          return b.duration_weeks - a.duration_weeks;
        case "name":
          return (locale === "ar" ? a.title_ar : a.title_en).localeCompare(
            locale === "ar" ? b.title_ar : b.title_en,
            locale,
          );
        case "newest":
        default:
          return b.id - a.id;
      }
    });
    return arr;
  }, [data, q, governorate, remoteOnly, savedOnly, sort, locale, isSaved]);

  const total = filtered.length;
  const start = (page - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  const hasActiveFilters =
    !!q || !!governorate || remoteOnly || savedOnly || sort !== "newest";
  const clearAll = () => {
    setQ("");
    setGovernorate("");
    setRemoteOnly(false);
    setSavedOnly(false);
    setSort("newest");
    setPage(1);
  };

  const fmt = new Intl.NumberFormat(locale === "ar" ? "ar-JO" : "en-US");

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Briefcase className="h-7 w-7 text-cyan-glow" />
            {t.nav.internships}
          </h1>
          <p className="mt-2 text-[rgb(var(--muted))]">
            {locale === "ar"
              ? "تصفّح فرص التدريب المفتوحة في كل أنحاء المملكة"
              : "Browse open internship opportunities across the Kingdom"}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_180px_180px_auto]">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgb(var(--muted))]" />
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder={locale === "ar" ? "ابحث عن فرصة تدريب..." : "Search internships..."}
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
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="h-11 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-glow/40"
          aria-label={locale === "ar" ? "ترتيب" : "Sort"}
        >
          <option value="newest">{locale === "ar" ? "الأحدث" : "Newest"}</option>
          <option value="shortest">{locale === "ar" ? "الأقصر مدة" : "Shortest"}</option>
          <option value="longest">{locale === "ar" ? "الأطول مدة" : "Longest"}</option>
          <option value="name">{locale === "ar" ? "الاسم" : "Name (A→Z)"}</option>
        </select>
        <label className="inline-flex items-center gap-2 px-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] cursor-pointer text-sm">
          <input
            type="checkbox"
            className="accent-cyan-glow"
            checked={remoteOnly}
            onChange={(e) => {
              setRemoteOnly(e.target.checked);
              setPage(1);
            }}
          />
          <Wifi className="h-4 w-4 text-cyan-glow" />
          {locale === "ar" ? "عن بُعد" : "Remote"}
        </label>
      </div>

      {/* Chips row */}
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-[rgb(var(--muted))]">
          {fmt.format(total)} {locale === "ar" ? "نتيجة" : "results"}
        </span>
        {q && (
          <Chip onClear={() => setQ("")}>
            {locale === "ar" ? "بحث" : "Search"}: <strong>{q}</strong>
          </Chip>
        )}
        {governorate && <Chip onClear={() => setGovernorate("")}>{governorate}</Chip>}
        {remoteOnly && (
          <Chip onClear={() => setRemoteOnly(false)}>
            {locale === "ar" ? "عن بُعد" : "Remote"}
          </Chip>
        )}
        {savedOnly && (
          <Chip onClear={() => setSavedOnly(false)}>
            {locale === "ar" ? "محفوظ" : "Saved"}
          </Chip>
        )}
        <button
          onClick={() => setSavedOnly((v) => !v)}
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold border ${
            savedOnly
              ? "bg-rose-500/15 text-rose-300 border-rose-400/30"
              : "border-[rgb(var(--border))] text-[rgb(var(--muted))] hover:bg-[rgb(var(--surface))]"
          }`}
        >
          <Heart className={`h-3 w-3 ${savedOnly ? "fill-rose-400" : ""}`} />
          {locale === "ar" ? "المحفوظة" : "Saved only"}
        </button>
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="ms-auto inline-flex items-center gap-1 rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-[11px] font-semibold text-[rgb(var(--muted))] hover:bg-[rgb(var(--surface))]"
          >
            <X className="h-3 w-3" />
            {locale === "ar" ? "مسح الكل" : "Clear all"}
          </button>
        )}
      </div>

      {error && (
        <Card className="mt-6">
          <CardContent className="p-6 text-sm text-red-500">{(error as Error).message}</CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="mt-8">
          <SkeletonList count={6} />
        </div>
      ) : total === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<Briefcase className="h-6 w-6" />}
            title={locale === "ar" ? "لا توجد فرص مطابقة" : "No internships match"}
            description={
              locale === "ar"
                ? "جرّب تخفيف التصفية أو امسح المرشّحات للبدء من جديد."
                : "Try loosening your filters or clear them to start over."
            }
            action={
              hasActiveFilters ? (
                <Button variant="outline" size="sm" onClick={clearAll}>
                  {locale === "ar" ? "مسح الكل" : "Clear all"}
                </Button>
              ) : null
            }
          />
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pageItems.map((it) => {
              const company = it.company;
              const title = locale === "ar" ? it.title_ar : it.title_en;
              const desc = locale === "ar" ? it.description_ar : it.description_en;
              const cname = locale === "ar" ? company.name_ar : company.name_en;
              const saved = isSaved(it.id);
              return (
                <Card
                  key={it.id}
                  className="group hover:border-cyan-glow/40 hover:shadow-[0_8px_30px_rgba(34,211,238,0.12)] transition-all flex flex-col relative"
                >
                  <button
                    onClick={() => toggleSaved(it.id)}
                    aria-label={saved ? (locale === "ar" ? "إلغاء الحفظ" : "Unsave") : (locale === "ar" ? "حفظ" : "Save")}
                    aria-pressed={saved}
                    className="absolute top-3 end-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[rgb(var(--background))]/60 backdrop-blur border border-[rgb(var(--border))] hover:scale-110 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow"
                  >
                    <Heart
                      className={`h-4 w-4 transition ${
                        saved ? "fill-rose-500 text-rose-500" : "text-[rgb(var(--muted))]"
                      }`}
                    />
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
                        {company.is_strategic_partner ? (
                          <Sparkles className="h-5 w-5" />
                        ) : (
                          <Briefcase className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate" title={title}>
                          {title}
                        </h3>
                        <p className="text-xs text-[rgb(var(--muted))] truncate">{cname}</p>
                        <p className="text-[11px] text-[rgb(var(--muted))] flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" />
                          {company.city}, {company.governorate}
                          {it.is_remote && (
                            <span className="ms-1 inline-flex items-center gap-0.5 text-cyan-700 dark:text-cyan-300">
                              · <Wifi className="h-3 w-3" /> {locale === "ar" ? "عن بُعد" : "Remote"}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <p className="mt-3 text-sm text-[rgb(var(--muted))] line-clamp-3">{desc}</p>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {toList(it.required_skills)
                        .slice(0, 4)
                        .map((s) => (
                          <Badge key={s} variant="cyan">
                            {s}
                          </Badge>
                        ))}
                    </div>

                    <div className="mt-3 flex items-center gap-3 text-[11px] text-[rgb(var(--muted))]">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {fmt.format(it.duration_weeks)} {locale === "ar" ? "أسابيع" : "weeks"}
                      </span>
                      {it.required_experience > 0 && (
                        <span>
                          {locale === "ar" ? "خبرة" : "Exp"}: {fmt.format(it.required_experience)}+{" "}
                          {locale === "ar" ? "سنة" : "yr"}
                        </span>
                      )}
                      {!it.is_open && (
                        <Badge variant="outline">{locale === "ar" ? "مغلق" : "Closed"}</Badge>
                      )}
                    </div>

                    <div className="mt-auto pt-4 flex items-center justify-between gap-2 border-t border-[rgb(var(--border))]">
                      <a
                        href={googleEarthUrl(
                          {
                            name: company.name_en,
                            address: company.address,
                            city: company.city,
                            governorate: company.governorate,
                            latitude: company.latitude,
                            longitude: company.longitude,
                          },
                          company.is_strategic_partner ? 400 : 650,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex flex-none items-center gap-1 rounded-lg bg-gradient-to-r from-cyan-500 to-sky-600 px-2.5 py-1.5 text-[11px] font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                        title={t.map.open_satellite}
                      >
                        <Globe2 className="h-3 w-3" />
                        {t.nav.map}
                      </a>
                      <a
                        href={googleMapsSearchUrl({
                          name: company.name_en,
                          address: company.address,
                          city: company.city,
                          governorate: company.governorate,
                          latitude: company.latitude,
                          longitude: company.longitude,
                        })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex flex-none items-center gap-1 rounded-lg border border-[rgb(var(--border))] px-2.5 py-1.5 text-[11px] font-semibold hover:bg-[rgb(var(--surface))]"
                      >
                        <Navigation className="h-3 w-3" />
                        {t.map.directions}
                      </a>
                      <Link href={`/internships/${it.id}`}>
                        <Button size="sm">{locale === "ar" ? "عرض" : "View"}</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-8">
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={total}
              onPageChange={(p) => {
                setPage(p);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
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
      <button
        onClick={onClear}
        className="rounded-full hover:bg-cyan-glow/20 p-0.5"
        aria-label="Remove filter"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
