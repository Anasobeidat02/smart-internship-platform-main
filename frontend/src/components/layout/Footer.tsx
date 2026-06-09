"use client";

import { useI18n } from "@/components/providers/I18nProvider";
import { Sparkles, MapPin, Mail, GraduationCap } from "lucide-react";
import Link from "next/link";

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="mt-auto border-t border-[rgb(var(--border))] bg-[rgb(var(--surface))]/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 grid gap-8 md:grid-cols-4">
        {/* Brand */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-bold">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-cyan-glow text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            {t.brand}
          </div>
          <p className="text-sm text-[rgb(var(--muted))]">{t.tagline}</p>
        </div>

        {/* Platform links */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Platform</h4>
          <ul className="space-y-2 text-sm text-[rgb(var(--muted))]">
            <li><Link className="hover:text-[rgb(var(--foreground))]" href="/map">{t.nav.map}</Link></li>
            <li><Link className="hover:text-[rgb(var(--foreground))]" href="/companies">{t.nav.companies}</Link></li>
            <li><Link className="hover:text-[rgb(var(--foreground))]" href="/internships">{t.nav.internships}</Link></li>
          </ul>
        </div>

        {/* University Partner — replaces Strategic Partner / TWG */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm flex items-center gap-1.5">
            <GraduationCap className="h-4 w-4 text-brand-500" />
            {t.partner.kicker}
          </h4>
          <p className="text-sm font-medium text-[rgb(var(--foreground))]">
            {t.partner.twg_title}
          </p>
          <p className="text-sm text-[rgb(var(--muted))] flex gap-1.5">
            <MapPin className="h-4 w-4 flex-none mt-0.5 text-brand-500" />
            <span>{t.partner.address}</span>
          </p>
          <a
            href="https://www.bau.edu.jo"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-300 hover:underline"
          >
            {t.partner.visit} →
          </a>
        </div>

        {/* Contact */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Contact</h4>
          <p className="text-sm text-[rgb(var(--muted))] flex items-center gap-1.5">
            <Mail className="h-4 w-4" /> hello@smartintern.jo
          </p>
        </div>
      </div>
      <div className="border-t border-[rgb(var(--border))]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 text-xs text-[rgb(var(--muted))] text-center">
          © {new Date().getFullYear()} {t.brand}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
