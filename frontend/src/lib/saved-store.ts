"use client";

import { useCallback, useSyncExternalStore } from "react";

const KEY = "smartintern:saved-internships";
const EVENT = "saved-internships-changed";

function read(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((n) => typeof n === "number") : [];
  } catch {
    return [];
  }
}

function write(ids: number[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch {
    /* ignore */
  }
}

// Stable snapshot cache so getSnapshot returns the same array reference until it changes.
let cached: number[] = [];
let cachedKey = "";
const EMPTY: number[] = [];

function getSnapshot(): number[] {
  const fresh = read();
  const key = fresh.join(",");
  if (key !== cachedKey) {
    cachedKey = key;
    cached = fresh;
  }
  return cached;
}

function getServerSnapshot(): number[] {
  return EMPTY;
}

function subscribe(listener: () => void): () => void {
  window.addEventListener(EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

export function useSavedInternships() {
  const ids = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback((id: number) => {
    const current = read();
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    write(next);
  }, []);

  const isSaved = useCallback((id: number) => ids.includes(id), [ids]);

  // hydrated kept for API compatibility - useSyncExternalStore avoids hydration mismatches via server snapshot.
  return { ids, isSaved, toggle, hydrated: true as const };
}
