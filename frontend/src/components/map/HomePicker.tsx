"use client";

import maplibregl, { type Map as MapLibreMap, type Marker as MarkerType } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/providers/I18nProvider";
import { Locate, Loader2 } from "lucide-react";
import { toast } from "sonner";

const TILES =
  process.env.NEXT_PUBLIC_MAP_TILES ?? "https://tiles.openfreemap.org/styles/liberty";

export interface HomePickerProps {
  value: { lat: number; lng: number } | null;
  onChange: (coords: { lat: number; lng: number }) => void;
  height?: string;
  className?: string;
}

const JORDAN_CENTER: [number, number] = [36.2, 31.4];

export function HomePicker({ value, onChange, height = "320px", className }: HomePickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<MarkerType | null>(null);
  const onChangeRef = useRef(onChange);
  const [loadingLoc, setLoadingLoc] = useState(false);
  const { t, locale } = useI18n();
  const hasAutoLocated = useRef(false);
  const pendingLocationRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const placeMarker = (map: MapLibreMap, lng: number, lat: number) => {
    if (markerRef.current) {
      markerRef.current.setLngLat([lng, lat]);
      return;
    }
    const el = document.createElement("div");
    el.style.cssText =
      "width:22px;height:22px;border-radius:9999px;background:linear-gradient(135deg,#ef4444,#f97316);box-shadow:0 0 0 4px rgba(239,68,68,0.35),0 4px 14px rgba(0,0,0,0.4);";
    markerRef.current = new maplibregl.Marker({ element: el, draggable: true })
      .setLngLat([lng, lat])
      .addTo(map);
    markerRef.current.on("dragend", () => {
      const ll = markerRef.current!.getLngLat();
      onChangeRef.current({ lat: ll.lat, lng: ll.lng });
    });
  };

  const handleGeolocate = (showErrorToast: boolean = true) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      if (showErrorToast) {
        toast.error("Geolocation is not supported by your browser");
      }
      return;
    }
    setLoadingLoc(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLoadingLoc(false);
        const { latitude, longitude } = position.coords;
        const map = mapRef.current;
        if (map) {
          placeMarker(map, longitude, latitude);
          map.flyTo({ center: [longitude, latitude], zoom: 13, essential: true });
          onChangeRef.current({ lat: latitude, lng: longitude });
        } else {
          pendingLocationRef.current = { lat: latitude, lng: longitude };
        }
      },
      (error) => {
        setLoadingLoc(false);
        console.warn("Geolocation error:", error);
        if (showErrorToast) {
          toast.error(
            error.code === 1
              ? (locale === "ar"
                  ? "يرجى السماح بالوصول إلى الموقع الجغرافي لتحديد موقعك الحالي."
                  : "Please enable location access to find your current position.")
              : (locale === "ar"
                  ? "تعذر تحديد الموقع الجغرافي الحالي."
                  : "Failed to detect current location.")
          );
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Auto geolocate on load if no value is set
  useEffect(() => {
    if (!value && !hasAutoLocated.current) {
      hasAutoLocated.current = true;
      handleGeolocate(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let start: [number, number] = JORDAN_CENTER;
    let initialZoom = 7.2;

    if (value) {
      start = [value.lng, value.lat];
      initialZoom = 11;
    } else if (pendingLocationRef.current) {
      start = [pendingLocationRef.current.lng, pendingLocationRef.current.lat];
      initialZoom = 13;
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: TILES,
      center: start,
      zoom: initialZoom,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;

    if (value) {
      placeMarker(map, value.lng, value.lat);
    } else if (pendingLocationRef.current) {
      placeMarker(map, pendingLocationRef.current.lng, pendingLocationRef.current.lat);
      onChangeRef.current({ lat: pendingLocationRef.current.lat, lng: pendingLocationRef.current.lng });
      pendingLocationRef.current = null;
    }

    map.on("click", (e) => {
      placeMarker(map, e.lngLat.lng, e.lngLat.lat);
      onChangeRef.current({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={className} style={{ position: "relative", width: "100%", height }}>
      <div
        ref={containerRef}
        style={{ position: "absolute", inset: 0, borderRadius: "inherit", overflow: "hidden" }}
      />
      <button
        type="button"
        onClick={() => handleGeolocate(true)}
        disabled={loadingLoc}
        className="absolute top-3 start-3 z-10 flex items-center gap-1.5 rounded-lg bg-slate-900/85 backdrop-blur-md border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800/95 active:scale-95 shadow-lg transition-all disabled:opacity-75 cursor-pointer"
      >
        {loadingLoc ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" />
        ) : (
          <Locate className="h-3.5 w-3.5 text-cyan-400" />
        )}
        <span>{t.map.near_me}</span>
      </button>
    </div>
  );
}

