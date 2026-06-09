"use client";

import { useI18n } from "@/components/providers/I18nProvider";
import { api } from "@/lib/api";
import type { AnalyticsOverview } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { motion, useInView, useMotionValue, animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { GraduationCap, Building2, Award, Users } from "lucide-react";

function Counter({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const motionVal = useMotionValue(0);
  const [display, setDisplay] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !inView) return;
    const controls = animate(motionVal, value, {
      duration: 1.6,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.floor(v)),
    });
    return controls.stop;
  }, [inView, value, motionVal, mounted]);

  if (!mounted) {
    return <span ref={ref}>0</span>;
  }

  return <span ref={ref}>{display.toLocaleString()}</span>;
}

export function Stats() {
  const { t } = useI18n();
  const { data } = useQuery({
    queryKey: ["analytics-overview"],
    queryFn: () => api<AnalyticsOverview>("/analytics/overview", { auth: false }),
  });

  const items = [
    { icon: GraduationCap, label: t.stats.universities, value: data?.universities ?? 30, color: "from-brand-500 to-brand-700" },
    { icon: Building2, label: t.stats.companies, value: data?.companies ?? 60, color: "from-cyan-glow to-brand-500" },
    // { icon: Award, label: t.stats.partners, value: data?.strategic_partners ?? 1, color: "from-gold-500 to-gold-600" },
    { icon: Users, label: t.stats.students, value: data?.students ?? 1, color: "from-brand-400 to-cyan-glow" },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="glass relative overflow-hidden rounded-2xl p-6"
          >
            <div className={`absolute -top-8 -end-8 h-24 w-24 rounded-full bg-gradient-to-br ${item.color} opacity-20 blur-2xl`} />
            <item.icon className="h-7 w-7 text-brand-500 dark:text-brand-300" />
            <div className="mt-4 text-4xl font-bold tracking-tight">
              <Counter value={item.value} />
            </div>
            <div className="mt-1 text-sm text-[rgb(var(--muted))]">{item.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
