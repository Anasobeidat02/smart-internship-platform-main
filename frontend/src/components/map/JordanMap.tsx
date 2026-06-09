"use client";

import maplibregl, {
  type Map as MapLibreMap,
  type LngLatLike,
  type Marker as MarkerType,
  type StyleSpecification,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useMemo, useRef } from "react";
import type { Company, University } from "@/lib/types";
import { googleEarthUrl, googleMapsSearchUrl } from "@/lib/utils";

/** Esri World Imagery - high-res satellite tiles (free, attribution required). */
const SATELLITE_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    "esri-imagery": {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution:
        'Imagery © <a href="https://www.esri.com/" target="_blank" rel="noopener">Esri</a>, Maxar, Earthstar Geographics',
    },
    "esri-labels": {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 19,
    },
  },
  layers: [
    { id: "imagery", type: "raster", source: "esri-imagery" },
    { id: "labels", type: "raster", source: "esri-labels", paint: { "raster-opacity": 0.85 } },
  ],
};

const STREETS_URL = "https://tiles.openfreemap.org/styles/liberty";

export interface JordanMapMarker {
  id: string | number;
  lat: number;
  lng: number;
  label: string;
  kind: "company" | "strategic" | "home" | "university";
  meta?: Record<string, unknown>;
}

export interface JordanMapI18n {
  open_satellite: string;
  directions: string;
  popup_home: string;
  popup_university: string;
  popup_strategic: string;
}

export interface JordanMapProps {
  markers: JordanMapMarker[];
  height?: string;
  focusOn?: { lat: number; lng: number; zoom?: number } | null;
  onMarkerClick?: (m: JordanMapMarker) => void;
  className?: string;
  /** "satellite" | "streets". Switching at runtime calls `setStyle`. Default "satellite". */
  layer?: "satellite" | "streets";
  /** Show MapLibre geolocate (near-me) control. */
  geolocate?: boolean;
  /** Reset signal - bump this number to refit to Jordan bounds. */
  resetSignal?: number;
  /** i18n strings for popup buttons & sublines. */
  i18n?: Partial<JordanMapI18n>;
}

const JORDAN_CENTER: LngLatLike = [36.2, 31.4];
const JORDAN_BOUNDS: [[number, number], [number, number]] = [
  [34.95, 29.18], // sw
  [39.30, 33.38], // ne
];

const DEFAULT_I18N: JordanMapI18n = {
  open_satellite: "Open in Map",
  directions: "Directions",
  popup_home: "Your home",
  popup_university: "University",
  popup_strategic: "★ STRATEGIC PARTNER",
};

const KIND_STYLE: Record<
  JordanMapMarker["kind"],
  { bg: string; ring: string; size: number; pulse?: boolean }
> = {
  company:    { bg: "linear-gradient(135deg,#22d3ee,#0ea5e9)",  ring: "rgba(34,211,238,0.55)",  size: 24 },
  strategic:  { bg: "linear-gradient(135deg,#fbbf24,#d97706)",  ring: "rgba(251,191,36,0.65)",  size: 34, pulse: true },
  home:       { bg: "linear-gradient(135deg,#ef4444,#f97316)",  ring: "rgba(239,68,68,0.55)",   size: 22, pulse: true },
  university: { bg: "linear-gradient(135deg,#a78bfa,#6366f1)",  ring: "rgba(167,139,250,0.55)", size: 22 },
};

export function JordanMap({
  markers,
  height = "100%",
  focusOn,
  onMarkerClick,
  className,
  layer = "satellite",
  geolocate = true,
  resetSignal = 0,
  i18n,
}: JordanMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerObjs = useRef<MarkerType[]>([]);
  const currentLayerRef = useRef<"satellite" | "streets">(layer);
  const strings = useMemo(() => ({ ...DEFAULT_I18N, ...(i18n ?? {}) }), [i18n]);
  const stringsRef = useRef(strings);
  useEffect(() => {
    stringsRef.current = strings;
  }, [strings]);

  // init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: layer === "satellite" ? SATELLITE_STYLE : STREETS_URL,
      center: JORDAN_CENTER,
      zoom: 7.2,
      minZoom: 6.5,
      maxZoom: 18,
      attributionControl: { compact: true },
      pitch: 0,
      bearing: 0,
    });
    map.addControl(
      new maplibregl.NavigationControl({ showCompass: true, visualizePitch: true }),
      "top-right",
    );
    map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-left");
    if (geolocate) {
      map.addControl(
        new maplibregl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
        }),
        "top-right",
      );
    }
    mapRef.current = map;
    currentLayerRef.current = layer;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // runtime layer swap
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (currentLayerRef.current === layer) return;
    currentLayerRef.current = layer;
    map.setStyle(layer === "satellite" ? SATELLITE_STYLE : STREETS_URL);
    // markers are re-added by the markers effect after style.load
    map.once("style.load", () => {
      // trigger re-render of markers by clearing and reapplying via current markers prop
      applyMarkers(map, markers, onMarkerClick, stringsRef.current, markerObjs);
    });
  }, [layer, markers, onMarkerClick]);

  // update markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (map.isStyleLoaded()) {
      applyMarkers(map, markers, onMarkerClick, stringsRef.current, markerObjs);
    } else {
      map.once("load", () =>
        applyMarkers(map, markers, onMarkerClick, stringsRef.current, markerObjs),
      );
    }
  }, [markers, onMarkerClick]);

  // focus
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusOn) return;
    map.flyTo({
      center: [focusOn.lng, focusOn.lat],
      zoom: focusOn.zoom ?? 14,
      pitch: currentLayerRef.current === "satellite" ? 45 : 0,
      bearing: 0,
      speed: 1.4,
      essential: true,
    });
  }, [focusOn]);

  // reset
  useEffect(() => {
    if (!resetSignal) return;
    const map = mapRef.current;
    if (!map) return;
    map.fitBounds(JORDAN_BOUNDS, { padding: 60, duration: 1200, pitch: 0, bearing: 0 });
  }, [resetSignal]);

  return (
    <div className={className} style={{ position: "relative", width: "100%", height }}>
      <style>{`
        @keyframes smPulse {
          0%   { box-shadow: 0 0 0 0 rgba(251,191,36,0.65), 0 6px 18px rgba(0,0,0,0.55); }
          70%  { box-shadow: 0 0 0 22px rgba(251,191,36,0), 0 6px 18px rgba(0,0,0,0.55); }
          100% { box-shadow: 0 0 0 0 rgba(251,191,36,0), 0 6px 18px rgba(0,0,0,0.55); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes smPulse { 0%,100% { box-shadow: 0 6px 18px rgba(0,0,0,0.55); } }
        }
        .sm-popup .maplibregl-popup-content {
          background: rgba(15,23,42,0.96);
          backdrop-filter: blur(12px);
          color: #e2e8f0;
          border-radius: 14px;
          padding: 14px 16px;
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 20px 60px rgba(0,0,0,0.55);
        }
        .sm-popup .maplibregl-popup-tip { border-top-color: rgba(15,23,42,0.96); border-bottom-color: rgba(15,23,42,0.96); }
        .sm-popup .maplibregl-popup-close-button { color: #94a3b8; font-size: 18px; padding: 4px 8px; }
        .sm-popup .maplibregl-popup-close-button:hover { color: #fff; background: transparent; }
      `}</style>
      <div
        ref={containerRef}
        style={{ position: "absolute", inset: 0, borderRadius: "inherit", overflow: "hidden" }}
      />
    </div>
  );
}

function applyMarkers(
  map: MapLibreMap,
  markers: JordanMapMarker[],
  onMarkerClick: ((m: JordanMapMarker) => void) | undefined,
  strings: JordanMapI18n,
  markerObjs: React.MutableRefObject<MarkerType[]>,
) {
  markerObjs.current.forEach((m) => m.remove());
  markerObjs.current = [];

  markers.forEach((m) => {
    const style = KIND_STYLE[m.kind];
    const el = document.createElement("button");
    el.type = "button";
    el.setAttribute("aria-label", m.label);
    el.style.cssText = `
      width:${style.size}px;height:${style.size}px;
      border-radius:9999px;cursor:pointer;border:2px solid rgba(255,255,255,0.9);
      background:${style.bg};
      box-shadow:0 0 0 4px ${style.ring}, 0 6px 18px rgba(0,0,0,0.55);
      transition:transform .18s ease, box-shadow .18s ease;
      display:flex;align-items:center;justify-content:center;color:#fff;
    `;
    if (style.pulse) el.style.animation = "smPulse 2s ease-out infinite";
    el.onmouseenter = () => {
      el.style.transform = "scale(1.22)";
      el.style.zIndex = "10";
    };
    el.onmouseleave = () => {
      el.style.transform = "scale(1)";
      el.style.zIndex = "1";
    };

    const place = {
      name: m.label,
      address: (m.meta?.address as string | undefined) ?? null,
      city: (m.meta?.city as string | undefined) ?? null,
      governorate: (m.meta?.governorate as string | undefined) ?? null,
      latitude: m.lat,
      longitude: m.lng,
    };
    const earth = googleEarthUrl(place, m.kind === "strategic" ? 400 : 650);
    const gmaps = googleMapsSearchUrl(place);

    const subline = (() => {
      if (m.kind === "strategic")
        return `<div style="font-size:11px;color:#fbbf24;margin-top:2px;font-weight:700;letter-spacing:.3px">${escapeHtml(strings.popup_strategic)}</div>`;
      if (m.kind === "home")
        return `<div style="font-size:11px;color:#fb923c;margin-top:2px">${escapeHtml(strings.popup_home)}</div>`;
      if (m.kind === "university")
        return `<div style="font-size:11px;color:#a78bfa;margin-top:2px">${escapeHtml(strings.popup_university)}</div>`;
      return "";
    })();
    const addressLine = m.meta?.address
      ? `<div style="font-size:11px;color:#94a3b8;margin-top:4px">${escapeHtml(String(m.meta.address))}</div>`
      : "";
    const coordsLine = `<div style="font-size:10px;color:#64748b;margin-top:6px;font-family:ui-monospace,monospace">${m.lat.toFixed(5)}, ${m.lng.toFixed(5)}</div>`;
    const popup = new maplibregl.Popup({
      closeButton: true,
      offset: 18,
      maxWidth: "300px",
      className: "sm-popup",
    }).setHTML(`
      <div style="font-weight:700;font-size:13px;line-height:1.3;color:#f8fafc">${escapeHtml(m.label)}</div>
      ${subline}
      ${addressLine}
      ${coordsLine}
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">
        <a href="${earth}" target="_blank" rel="noopener noreferrer"
           style="display:inline-flex;align-items:center;gap:6px;padding:7px 11px;border-radius:8px;background:linear-gradient(135deg,#10b981,#059669);color:#fff;font-size:11px;font-weight:700;text-decoration:none;box-shadow:0 4px 12px rgba(16,185,129,0.35)">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          ${escapeHtml(strings.open_satellite)}
        </a>
        <a href="${gmaps}" target="_blank" rel="noopener noreferrer"
           style="display:inline-flex;align-items:center;gap:6px;padding:7px 11px;border-radius:8px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:#e2e8f0;font-size:11px;font-weight:600;text-decoration:none">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          ${escapeHtml(strings.directions)}
        </a>
      </div>
    `);

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([m.lng, m.lat])
      .setPopup(popup)
      .addTo(map);

    el.addEventListener("click", (ev) => {
      ev.stopPropagation();
      onMarkerClick?.(m);
    });

    markerObjs.current.push(marker);
  });
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

export function companiesToMarkers(companies: Company[]): JordanMapMarker[] {
  return companies.map((c) => ({
    id: `c-${c.id}`,
    lat: c.latitude,
    lng: c.longitude,
    label: c.name_en,
    kind: c.is_strategic_partner ? "strategic" : "company",
    meta: {
      company: c,
      address: c.address ?? `${c.city}, ${c.governorate}`,
      city: c.city,
      governorate: c.governorate,
    },
  }));
}

export function universitiesToMarkers(unis: University[]): JordanMapMarker[] {
  return unis.map((u) => ({
    id: `u-${u.id}`,
    lat: u.latitude,
    lng: u.longitude,
    label: u.name_en,
    kind: "university",
    meta: { city: u.city, governorate: u.governorate },
  }));
}
