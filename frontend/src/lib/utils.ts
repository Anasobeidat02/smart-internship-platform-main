import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(km < 10 ? 1 : 0)} km`;
}

export function formatScore(score: number): string {
  return `${Math.round(score)}%`;
}

/**
 * Normalise a value that may arrive as a comma-separated string OR a string[]
 * (the backend sometimes serialises list fields as comma-joined strings).
 */
export function toList(value: string | string[] | null | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return value
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Build a Google Maps deep link for a place. Prefers an `address` + name search
 * so Google's geocoder picks the real business pin, but always appends the
 * exact lat/lng as a fallback so the location is unambiguous.
 */
export interface MapPlace {
  name?: string | null;
  address?: string | null;
  city?: string | null;
  governorate?: string | null;
  latitude: number;
  longitude: number;
}

export function googleMapsSearchUrl(p: MapPlace): string {
  const parts = [p.name, p.address, p.city, p.governorate, "Jordan"].filter(Boolean) as string[];
  const q = parts.length ? parts.join(", ") : `${p.latitude},${p.longitude}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export function googleMapsPinUrl(p: MapPlace): string {
  // Always opens the exact lat/lng pin on Google Maps, regardless of geocoding.
  return `https://www.google.com/maps/?q=${p.latitude},${p.longitude}`;
}

/**
 * Open the exact coordinates in Google Earth Web. The `@lat,lng,alt,range,...`
 * grammar makes Earth zoom straight to the place at a satellite-friendly tilt.
 *  - alt   = altitude of the camera target (meters above ground)
 *  - range = distance from camera to target (meters) - smaller = closer
 *  - 30y   = field of view
 *  - 0h    = heading (north up)
 *  - 45t   = tilt (45° gives the iconic 3D look)
 */
export function googleEarthUrl(p: MapPlace, range = 600): string {
  return `https://earth.google.com/web/@${p.latitude},${p.longitude},0a,${range}d,30y,0h,45t,0r`;
}

export function googleMapsDirectionsUrl(
  destination: MapPlace,
  origin?: { lat: number; lng: number } | null
): string {
  const dest = `${destination.latitude},${destination.longitude}`;
  const base = `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`;
  if (origin) {
    return `${base}&origin=${origin.lat},${origin.lng}`;
  }
  return base;
}

export function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

