"use client";

import dynamic from "next/dynamic";
import { useI18n } from "@/components/providers/I18nProvider";
import { api } from "@/lib/api";
import type { Company, StudentProfile, University } from "@/lib/types";
import type { JordanMapMarker } from "@/components/map/JordanMap";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Building2,
  MapPin,
  Sparkles,
  ExternalLink,
  Globe2,
  X,
  Search,
  Layers,
  Satellite,
  Map as MapIcon,
  RotateCcw,
  ChevronUp,
} from "lucide-react";
import { Badge } from "@/components/ui/Card";
import { toList, googleEarthUrl, googleMapsSearchUrl, getDistanceKm, googleMapsDirectionsUrl } from "@/lib/utils";
import { useAuth } from "@/lib/auth-store";

const JordanMap = dynamic(
  () => import("@/components/map/JordanMap").then((m) => m.JordanMap),
  { ssr: false, loading: () => <div className="h-full w-full bg-black/50 animate-pulse" /> },
);

export default function MapPage() {
  const { t, locale } = useI18n();
  const [strategic, setStrategic] = useState(false);
  const [governorate, setGovernorate] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Company | null>(null);
  const [layer, setLayer] = useState<"satellite" | "streets">("satellite");
  const [resetSignal, setResetSignal] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { user, hydrated } = useAuth();
  const [maxDistance, setMaxDistance] = useState<number>(30); // 30km default

  const companiesQ = useQuery({
    queryKey: ["companies-map"],
    queryFn: () => api<Company[]>("/companies/", { auth: false, query: { limit: 200 } }),
  });

  const profileQ = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => api<StudentProfile>("/students/me"),
    enabled: hydrated && user?.role === "student",
    retry: false,
  });

  const unisQ = useQuery({
    queryKey: ["universities"],
    queryFn: () => api<University[]>("/universities/", { auth: false }),
  });

  const governorates = useMemo(() => {
    const set = new Set<string>();
    companiesQ.data?.forEach((c) => set.add(c.governorate));
    return Array.from(set).sort();
  }, [companiesQ.data]);

  const hasHome = useMemo(() => {
    return profileQ.data?.home_latitude != null && profileQ.data?.home_longitude != null;
  }, [profileQ.data]);

  const filtered = useMemo(() => {
    const profile = profileQ.data;
    const homeLat = profile?.home_latitude;
    const homeLng = profile?.home_longitude;
    const usesDistance = homeLat != null && homeLng != null;

    return (companiesQ.data ?? []).filter((c) => {
      if (strategic && !c.is_strategic_partner) return false;
      if (governorate && c.governorate !== governorate) return false;
      
      if (usesDistance) {
        const dist = getDistanceKm(homeLat, homeLng, c.latitude, c.longitude);
        if (dist > maxDistance) return false;
      }

      if (search) {
        const n = search.toLowerCase();
        const hay = `${c.name_en} ${c.name_ar} ${c.city} ${c.governorate} ${toList(c.training_fields).join(" ")}`.toLowerCase();
        if (!hay.includes(n)) return false;
      }
      return true;
    });
  }, [companiesQ.data, strategic, governorate, search, profileQ.data, maxDistance]);

  const markers = useMemo(() => {
    const list: JordanMapMarker[] = filtered.map((c) => ({
      id: `c-${c.id}`,
      lat: c.latitude,
      lng: c.longitude,
      label: locale === "ar" ? c.name_ar : c.name_en,
      kind: c.is_strategic_partner ? "strategic" : "company",
      meta: {
        company: c,
        address: c.address ?? `${c.city}, ${c.governorate}`,
        city: c.city,
        governorate: c.governorate,
      },
    }));

    const profile = profileQ.data;
    if (profile) {
      if (profile.home_latitude != null && profile.home_longitude != null) {
        list.push({
          id: "student-home",
          lat: profile.home_latitude,
          lng: profile.home_longitude,
          label: locale === "ar" ? "موقع سكنك" : "Your home",
          kind: "home" as const,
          meta: {},
        });
      }

      const university = unisQ.data?.find((u) => u.id === profile.university_id);
      if (university) {
        list.push({
          id: `u-${university.id}`,
          lat: university.latitude,
          lng: university.longitude,
          label: locale === "ar" ? university.name_ar : university.name_en,
          kind: "university" as const,
          meta: {},
        });
      }
    }

    return list;
  }, [filtered, locale, profileQ.data, unisQ.data]);

  const mapI18n = {
    open_satellite: t.map.open_satellite,
    directions: t.map.directions,
    popup_home: t.map.popup_home,
    popup_university: t.map.popup_university,
    popup_strategic: locale === "ar" ? "★ شريك استراتيجي" : "★ STRATEGIC PARTNER",
  };

  const placeFor = (c: Company) => ({
    name: locale === "ar" ? c.name_ar : c.name_en,
    address: c.address,
    city: c.city,
    governorate: c.governorate,
    latitude: c.latitude,
    longitude: c.longitude,
  });

  const selectedEarth = selected ? googleEarthUrl(placeFor(selected), 400) : "";
  const selectedMaps = selected ? googleMapsSearchUrl(placeFor(selected)) : "";

  const resetAll = () => {
    setSelected(null);
    setSearch("");
    setGovernorate("");
    setStrategic(false);
    setResetSignal((n) => n + 1);
  };

  return (
    <div className="relative h-[calc(100vh-4rem)] w-full overflow-hidden bg-slate-950">
      <JordanMap
        markers={markers}
        focusOn={selected ? { lat: selected.latitude, lng: selected.longitude, zoom: 15 } : null}
        onMarkerClick={(m) => {
          const c = (m.meta as { company?: Company })?.company;
          if (c) setSelected(c);
        }}
        className="absolute inset-0"
        layer={layer}
        resetSignal={resetSignal}
        i18n={mapI18n}
      />

      {/* Top-start brand pill */}
      <div className="pointer-events-none absolute top-4 start-4 sm:start-6 z-10">
        <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-slate-900/80 backdrop-blur-xl border border-white/10 px-4 py-2 shadow-2xl">
          <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-sky-600 text-white">
            <MapIcon className="h-4 w-4" />
          </span>
          <div className="text-white">
            <div className="text-xs uppercase tracking-wider text-cyan-200 font-semibold leading-none">
              {t.nav.map}
            </div>
            <div className="text-[11px] text-slate-300 leading-tight max-w-[180px] truncate">
              {t.map.title}
            </div>
          </div>
        </div>
      </div>

      {/* Layer + reset cluster (top-end, below NavigationControl) */}
      <div className="pointer-events-none absolute top-4 end-4 sm:end-6 z-10 flex flex-col gap-2 items-end">
        {/* spacer to avoid overlap with maplibre nav controls (top-right) */}
        <div className="h-24" aria-hidden />
        <div className="pointer-events-auto inline-flex rounded-full bg-slate-900/80 backdrop-blur-xl border border-white/10 p-1 shadow-xl">
          <button
            onClick={() => setLayer("satellite")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
              layer === "satellite"
                ? "bg-cyan-500 text-white shadow"
                : "text-slate-300 hover:text-white"
            }`}
            aria-pressed={layer === "satellite"}
          >
            <Satellite className="h-3 w-3" />
            {t.map.layer_satellite}
          </button>
          <button
            onClick={() => setLayer("streets")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
              layer === "streets"
                ? "bg-cyan-500 text-white shadow"
                : "text-slate-300 hover:text-white"
            }`}
            aria-pressed={layer === "streets"}
          >
            <MapIcon className="h-3 w-3" />
            {t.map.layer_streets}
          </button>
        </div>
        <button
          onClick={resetAll}
          className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-slate-900/80 backdrop-blur-xl border border-white/10 px-3 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-800/90 shadow-xl"
        >
          <RotateCcw className="h-3 w-3" />
          {t.map.reset_view}
        </button>
      </div>

      {/* Desktop side panel */}
      <div className="pointer-events-none absolute inset-y-0 end-4 sm:end-6 hidden lg:flex flex-col justify-start gap-3 py-20 z-10 max-w-[92vw]">
        <FilterCard
          t={t}
          locale={locale}
          search={search}
          setSearch={setSearch}
          strategic={strategic}
          setStrategic={setStrategic}
          governorate={governorate}
          setGovernorate={setGovernorate}
          governorates={governorates}
          filteredCount={filtered.length}
          total={companiesQ.data?.length ?? 0}
          maxDistance={maxDistance}
          setMaxDistance={setMaxDistance}
          hasHome={hasHome}
        />
        <div className="pointer-events-auto w-80 rounded-xl bg-cyan-900/40 backdrop-blur-md border border-cyan-400/20 p-3 text-[11px] text-cyan-50">
          <div className="flex items-start gap-2">
            <Globe2 className="h-3.5 w-3.5 mt-0.5 flex-none text-cyan-300" />
            <p>{t.map.click_hint}</p>
          </div>
        </div>
      </div>

      {/* Mobile drawer toggle */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="lg:hidden pointer-events-auto absolute bottom-4 end-4 z-20 inline-flex items-center gap-2 rounded-full bg-cyan-500 text-white px-4 py-2.5 text-sm font-bold shadow-2xl shadow-cyan-900/40"
      >
        <Layers className="h-4 w-4" />
        {t.map.filters_title} ({filtered.length})
      </button>

      {/* Mobile drawer */}
      {drawerOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 rounded-t-3xl bg-slate-900 border-t border-white/10 shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="mx-auto mt-2 mb-2 h-1 w-12 rounded-full bg-white/20" />
            <div className="px-4 pb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-white">{t.map.filters_title}</h2>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-slate-300"
                  aria-label={t.common.close}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <FilterCard
                t={t}
                locale={locale}
                search={search}
                setSearch={setSearch}
                strategic={strategic}
                setStrategic={setStrategic}
                governorate={governorate}
                setGovernorate={setGovernorate}
                governorates={governorates}
                filteredCount={filtered.length}
                total={companiesQ.data?.length ?? 0}
                maxDistance={maxDistance}
                setMaxDistance={setMaxDistance}
                hasHome={hasHome}
                fullWidth
              />
            </div>
          </div>
        </>
      )}

      {/* Selection card */}
      {selected && (
        <div className="pointer-events-auto absolute bottom-4 start-1/2 -translate-x-1/2 w-[92%] max-w-xl rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-white/10 p-5 shadow-2xl text-white z-10">
          <button
            onClick={() => setSelected(null)}
            className="absolute top-3 end-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/5 hover:bg-white/15 text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            aria-label={t.common.close}
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-start gap-3">
            <div
              className={`flex-none h-12 w-12 rounded-xl bg-gradient-to-br ${
                selected.is_strategic_partner
                  ? "from-amber-400 to-amber-600"
                  : "from-cyan-400 to-sky-600"
              } flex items-center justify-center text-white shadow-lg`}
            >
              {selected.is_strategic_partner ? <Sparkles className="h-6 w-6" /> : <Building2 className="h-6 w-6" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold truncate">
                  {locale === "ar" ? selected.name_ar : selected.name_en}
                </h3>
                {selected.is_strategic_partner && <Badge variant="gold">{t.partner.kicker}</Badge>}
              </div>
              <p className="text-xs text-slate-300 flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" />
                {selected.address ?? `${selected.city}, ${selected.governorate}`}
              </p>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5" dir="ltr">
                {selected.latitude.toFixed(5)}, {selected.longitude.toFixed(5)}
              </p>

              {profileQ.data?.home_latitude != null && profileQ.data?.home_longitude != null && (
                <div className="mt-2 text-xs text-cyan-300 flex items-center gap-3 flex-wrap bg-white/5 border border-white/5 px-2.5 py-1.5 rounded-lg">
                  <span className="flex items-center gap-1">
                    📍 {getDistanceKm(
                      profileQ.data.home_latitude,
                      profileQ.data.home_longitude,
                      selected.latitude,
                      selected.longitude
                    ).toFixed(1)} km
                  </span>
                  <span className="flex items-center gap-1">
                    🚗 {Math.round(
                      getDistanceKm(
                        profileQ.data.home_latitude,
                        profileQ.data.home_longitude,
                        selected.latitude,
                        selected.longitude
                      ) * 1.33 + 5
                    )} {locale === "ar" ? "دقيقة" : "mins"}
                  </span>
                  <span className="flex items-center gap-1">
                    🚌 {Math.round(
                      getDistanceKm(
                        profileQ.data.home_latitude,
                        profileQ.data.home_longitude,
                        selected.latitude,
                        selected.longitude
                      ) * 3 + 10
                    )} {locale === "ar" ? "دقيقة" : "mins"}
                  </span>
                </div>
              )}

              <p className="text-sm text-slate-300 mt-2 line-clamp-2">
                {locale === "ar" ? selected.description_ar : selected.description_en}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {toList(selected.training_fields)
                  .slice(0, 5)
                  .map((f) => (
                    <span
                      key={f}
                      className="rounded-full bg-cyan-400/10 text-cyan-200 border border-cyan-400/20 px-2 py-0.5 text-[10px]"
                    >
                      {f}
                    </span>
                  ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={selectedEarth}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-sky-600 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-sky-900/40 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                >
                  <Globe2 className="h-3.5 w-3.5" />
                  {t.map.open_satellite}
                </a>
                <a
                  href={
                    profileQ.data?.home_latitude != null && profileQ.data?.home_longitude != null
                      ? googleMapsDirectionsUrl(
                          placeFor(selected),
                          { lat: profileQ.data.home_latitude, lng: profileQ.data.home_longitude }
                        )
                      : selectedMaps
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 px-3 py-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  {t.map.directions}
                </a>
                {selected.website && (
                  <a
                    href={selected.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 px-3 py-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {locale === "ar" ? "الموقع" : "Website"}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No results message */}
      {!companiesQ.isLoading && filtered.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-0">
          <div className="pointer-events-auto rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 px-6 py-4 text-sm text-slate-200">
            {t.map.no_results}
          </div>
        </div>
      )}
    </div>
  );
}

interface FilterCardProps {
  t: ReturnType<typeof useI18n>["t"];
  locale: "en" | "ar";
  search: string;
  setSearch: (v: string) => void;
  strategic: boolean;
  setStrategic: (v: boolean) => void;
  governorate: string;
  setGovernorate: (v: string) => void;
  governorates: string[];
  filteredCount: number;
  total: number;
  fullWidth?: boolean;
  maxDistance: number;
  setMaxDistance: (v: number) => void;
  hasHome: boolean;
}

function FilterCard(props: FilterCardProps) {
  const {
    t,
    locale,
    search,
    setSearch,
    strategic,
    setStrategic,
    governorate,
    setGovernorate,
    governorates,
    filteredCount,
    total,
    fullWidth,
    maxDistance,
    setMaxDistance,
    hasHome,
  } = props;
  return (
    <div
      className={`pointer-events-auto ${
        fullWidth ? "w-full" : "w-80"
      } rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 p-4 shadow-2xl text-white`}
    >
      <div className="flex items-center gap-2 mb-3">
        <Layers className="h-4 w-4 text-cyan-300" />
        <h2 className="text-sm font-semibold">{t.map.filters_title}</h2>
        <span className="ms-auto text-[11px] text-slate-400">
          {filteredCount} {t.map.of} {total}
        </span>
      </div>

      <div className="relative mb-3">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.map.search_placeholder}
          aria-label={t.map.search_placeholder}
          className="h-9 w-full rounded-lg bg-white/5 border border-white/10 ps-9 pe-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
        />
      </div>

      <label className="flex items-center justify-between gap-3 cursor-pointer rounded-lg px-2 py-1.5 hover:bg-white/5">
        <span className="text-xs inline-flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          {t.map.filter_strategic}
        </span>
        <input
          type="checkbox"
          checked={strategic}
          onChange={(e) => setStrategic(e.target.checked)}
          className="h-4 w-4 accent-amber-400"
        />
      </label>

      <div className="mt-2">
        <label htmlFor="map-gov" className="text-[10px] uppercase tracking-wider text-slate-400">
          {t.map.filter_gov}
        </label>
        <select
          id="map-gov"
          value={governorate}
          onChange={(e) => setGovernorate(e.target.value)}
          className="mt-1 h-9 w-full rounded-lg bg-white/5 border border-white/10 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
        >
          <option value="" className="bg-slate-900">
            {t.map.all_governorates}
          </option>
          {governorates.map((g) => (
            <option key={g} value={g} className="bg-slate-900">
              {g}
            </option>
          ))}
        </select>
      </div>

      {hasHome ? (
        <div className="mt-3">
          <label className="text-[10px] uppercase tracking-wider text-slate-400">
            {locale === "ar" ? "أقصى مسافة (كم)" : "Max Distance (km)"}
          </label>
          <div className="flex items-center gap-3 mt-1">
            <input
              type="range"
              min="1"
              max="100"
              value={maxDistance}
              onChange={(e) => setMaxDistance(Number(e.target.value))}
              className="flex-1 accent-cyan-400 h-1.5 bg-white/10 rounded-lg cursor-pointer"
            />
            <span className="text-xs font-mono font-bold text-cyan-300 w-12 text-end">
              {maxDistance === 100 ? "100+ km" : `${maxDistance} km`}
            </span>
          </div>
        </div>
      ) : (
        <div className="mt-3 text-[10px] text-slate-400 bg-white/5 border border-white/10 p-2 rounded-lg">
          {locale === "ar"
            ? "حدد موقع سكنك في الملف الشخصي لتفعيل فلتر المسافة"
            : "Set home location in profile to filter by distance"}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-[10px]">
        <LegendDot color="from-cyan-400 to-sky-600" label={t.map.legend_company} />
        <LegendDot color="from-amber-400 to-amber-600" label={t.map.legend_strategic} pulse />
        <LegendDot color="from-red-500 to-orange-500" label={t.map.legend_home} pulse />
        <LegendDot color="from-violet-400 to-indigo-500" label={t.map.legend_university} />
      </div>
    </div>
  );
}

function LegendDot({ color, label, pulse }: { color: string; label: string; pulse?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`relative inline-block h-2.5 w-2.5 rounded-full bg-gradient-to-br ${color}`}>
        {pulse && (
          <span
            className={`absolute inset-0 rounded-full bg-gradient-to-br ${color} animate-ping opacity-60`}
          />
        )}
      </span>
      <span className="text-slate-300">{label}</span>
    </div>
  );
}

// Unused but kept for parity with potential future use
void ChevronUp;
