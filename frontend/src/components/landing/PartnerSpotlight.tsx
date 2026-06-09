"use client";

import { useI18n } from "@/components/providers/I18nProvider";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { MapPin, Award, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export function PartnerSpotlight() {
  const { t, dir } = useI18n();
  const isRTL = dir === "rtl";

  return (
    <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-3xl border border-gold-500/30 bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 p-1 shadow-2xl"
      >
        <div className="absolute inset-0 bg-[radial-gradient(60rem_30rem_at_80%_-10%,rgba(245,184,0,0.25),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(40rem_20rem_at_-10%_120%,rgba(34,211,238,0.20),transparent_60%)]" />

        <div className="relative grid gap-8 rounded-[calc(theme(borderRadius.3xl)-4px)] bg-brand-950/40 p-8 backdrop-blur-sm lg:grid-cols-5 lg:p-12">
          <div className="lg:col-span-3 text-white">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/40 bg-gold-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold-300">
              <Award className="h-3.5 w-3.5" />
              {t.partner.kicker}
            </div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              {t.partner.twg_title}
            </h2>
            <p className="mt-1 text-lg text-gold-300/90">{t.partner.twg_subtitle}</p>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-brand-100">
              {t.partner.twg_body}
            </p>
            <div className="mt-6 flex items-center gap-2 text-sm text-brand-100">
              <MapPin className="h-4 w-4 text-gold-300" />
              {t.partner.address}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/partners">
                <Button variant="gold" size="lg">
                  {t.partner.visit}
                  <ArrowRight className={`h-4 w-4 ${isRTL ? "rotate-180" : ""}`} />
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="secondary" size="lg">
                  {t.hero.ctaPrimary}
                </Button>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-2 relative flex items-center justify-center">
            <div className="relative h-56 w-56 sm:h-64 sm:w-64">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gold-500 to-gold-600 opacity-30 blur-3xl animate-pulse" />
              <div className="absolute inset-4 rounded-full bg-gradient-to-br from-gold-500 to-gold-600 opacity-50 blur-xl" />
              <div className="relative h-full w-full rounded-full bg-gradient-to-br from-gold-300 via-gold-500 to-gold-600 p-1 shadow-2xl">
                <div className="h-full w-full rounded-full bg-brand-950 flex flex-col items-center justify-center">
                  <Sparkles className="h-12 w-12 text-gold-300 mb-2" />
                  <div className="text-3xl font-bold text-white">TWG</div>
                  <div className="text-sm text-gold-300 font-medium">ACADEMY</div>
                  <div className="mt-2 text-[10px] text-brand-200 uppercase tracking-widest">Strategic Partner</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
