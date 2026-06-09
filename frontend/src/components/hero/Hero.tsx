"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useI18n } from "@/components/providers/I18nProvider";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { ArrowRight, Map } from "lucide-react";
import { useEffect, useState } from "react";

const HeroScene = dynamic(
  () => import("@/components/hero/HeroScene").then((m) => m.HeroScene),
  { ssr: false, loading: () => <div className="absolute inset-0" /> }
);

export function Hero() {
  const { t, dir } = useI18n();
  const isRTL = dir === "rtl";
  const [showScene, setShowScene] = useState(false);

  useEffect(() => {
    // Delay loading the heavy 3D library by a short duration to prioritize page interactivity
    const timer = setTimeout(() => {
      setShowScene(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative overflow-hidden">
      <div className="aurora" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:px-8 lg:py-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative z-10"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-glow/40 bg-cyan-glow/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-700 dark:text-cyan-300">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-glow animate-pulse" />
            {t.hero.eyebrow}
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            <span className="gradient-text">{t.hero.title}</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-[rgb(var(--muted))] leading-relaxed">
            {t.hero.subtitle}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register">
              <Button size="lg">
                {t.hero.ctaPrimary}
                <ArrowRight className={`h-4 w-4 ${isRTL ? "rotate-180" : ""}`} />
              </Button>
            </Link>
            <Link href="/map">
              <Button variant="outline" size="lg">
                <Map className="h-4 w-4" />
                {t.hero.ctaSecondary}
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: "easeOut", delay: 0.15 }}
          className="relative h-[420px] lg:h-[520px]"
        >
          {showScene ? <HeroScene /> : <div className="absolute inset-0" />}
        </motion.div>
      </div>
    </section>
  );
}
