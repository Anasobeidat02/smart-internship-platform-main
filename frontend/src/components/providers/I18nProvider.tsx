"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { dictionaries, type Dictionary, type Locale } from "@/lib/i18n";

interface I18nCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Dictionary;
  dir: "ltr" | "rtl";
}

const Ctx = createContext<I18nCtx | null>(null);

const LOCALE_EVENT = "smartintern:locale-changed";

function detectLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const saved = window.localStorage.getItem("locale");
  if (saved === "en" || saved === "ar") return saved;
  const nav = typeof navigator !== "undefined" ? navigator.language.toLowerCase() : "en";
  return nav.startsWith("ar") ? "ar" : "en";
}

function subscribeLocale(listener: () => void): () => void {
  window.addEventListener(LOCALE_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(LOCALE_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore<Locale>(
    subscribeLocale,
    detectLocale,
    () => "en"
  );

  useEffect(() => {
    const dir = locale === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("locale", l);
      window.dispatchEvent(new CustomEvent(LOCALE_EVENT));
    }
  }, []);

  const value = useMemo<I18nCtx>(
    () => ({
      locale,
      setLocale,
      t: dictionaries[locale],
      dir: locale === "ar" ? "rtl" : "ltr",
    }),
    [locale, setLocale]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
