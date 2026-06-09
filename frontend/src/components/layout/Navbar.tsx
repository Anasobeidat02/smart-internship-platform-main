"use client";

import { useI18n } from "@/components/providers/I18nProvider";
import { useAuth } from "@/lib/auth-store";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Globe, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { t, locale, setLocale } = useI18n();
  const { user, logout, hydrated } = useAuth();
  const path = usePathname();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/", label: t.nav.home },
    { href: "/map", label: t.nav.map },
    { href: "/internships", label: t.nav.internships },
    { href: "/companies", label: t.nav.companies },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[rgb(var(--border))] bg-[rgb(var(--background))]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-cyan-glow text-white shadow-lg">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="hidden sm:inline">{t.brand}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                path === l.href
                  ? "text-brand-600 dark:text-brand-300 bg-brand-500/10"
                  : "text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))] hover:bg-[rgb(var(--surface))]"
              )}
            >
              {l.label}
            </Link>
          ))}
          {hydrated && user && (
            <Link
              href="/dashboard"
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                path?.startsWith("/dashboard")
                  ? "text-brand-600 dark:text-brand-300 bg-brand-500/10"
                  : "text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))] hover:bg-[rgb(var(--surface))]"
              )}
            >
              {t.nav.dashboard}
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLocale(locale === "en" ? "ar" : "en")}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))] hover:bg-[rgb(var(--surface))] transition-colors"
            aria-label="Toggle language"
          >
            <Globe className="h-4 w-4" />
            <span className="font-semibold">{locale === "en" ? "AR" : "EN"}</span>
          </button>

          {hydrated && user ? (
            <Button variant="outline" size="sm" onClick={logout} className="hidden sm:inline-flex">
              {t.nav.logout}
            </Button>
          ) : (
            <>
              <Link href="/login" className="hidden sm:inline-flex">
                <Button variant="ghost" size="sm">{t.nav.login}</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">{t.nav.register}</Button>
              </Link>
            </>
          )}

          <button
            className="md:hidden p-2 rounded-lg hover:bg-[rgb(var(--surface))]"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-[rgb(var(--border))] bg-[rgb(var(--background))]">
          <div className="mx-auto max-w-7xl px-4 py-3 flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-[rgb(var(--surface))]"
              >
                {l.label}
              </Link>
            ))}
            {hydrated && user && (
              <Link href="/dashboard" onClick={() => setOpen(false)} className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-[rgb(var(--surface))]">
                {t.nav.dashboard}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
