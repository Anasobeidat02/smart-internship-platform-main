"use client";

import { useI18n } from "@/components/providers/I18nProvider";
import { Brain, MapPin, Target, Zap, GraduationCap, Globe2 } from "lucide-react";
import { motion } from "framer-motion";

export function Features() {
  const { locale } = useI18n();
  const isAr = locale === "ar";

  const items = [
    {
      icon: Brain,
      title: isAr ? "مطابقة ذكية" : "AI-driven matching",
      body: isAr
        ? "نموذج هجين يجمع بين مهاراتك ومجالك وموقعك لتوصيات دقيقة."
        : "Hybrid model combining skills, field, geography, and partner boost for precise recommendations.",
    },
    {
      icon: MapPin,
      title: isAr ? "خريطة الأردن التفاعلية" : "Interactive Jordan map",
      body: isAr
        ? "كل الشركات والجامعات والشركاء على خريطة حية لكل المملكة."
        : "Every company, university, and partner across all twelve governorates on a live map.",
    },
    {
      icon: Target,
      title: isAr ? "توصيات شخصية" : "Personalised matches",
      body: isAr
        ? "ترتيب مفصّل بالنسبة المئوية والمسافة والأسباب لكل فرصة."
        : "Granular percentage scoring with distance, field, and skill breakdown for every opportunity.",
    },
    {
      icon: Zap,
      title: isAr ? "تطبيق سريع" : "One-click apply",
      body: isAr
        ? "قدّم لأي فرصة بضغطة واحدة من خلال ملفك الذكي."
        : "Apply to any internship in a single click from your unified smart profile.",
    },
    {
      icon: GraduationCap,
      title: isAr ? "30 جامعة أردنية" : "30 Jordanian universities",
      body: isAr
        ? "نغطي كل الجامعات الحكومية والخاصة في المملكة."
        : "Full coverage of every public and private university in the Kingdom.",
    },
    {
      icon: Globe2,
      title: isAr ? "ثنائي اللغة" : "Bilingual & RTL",
      body: isAr
        ? "تجربة كاملة بالعربية والإنجليزية مع دعم اتجاه النص."
        : "Native Arabic + English experience with full RTL support.",
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {isAr ? "منصة مبنية على ذكاء حقيقي" : "A platform powered by real intelligence"}
        </h2>
        <p className="mt-4 text-[rgb(var(--muted))]">
          {isAr
            ? "كل ما تحتاجه لاكتشاف أفضل تدريب يناسب مسارك المهني"
            : "Everything you need to discover the perfect internship for your career path."}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it, i) => (
          <motion.div
            key={it.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="group relative overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6 transition-all hover:border-cyan-glow/40 hover:shadow-[0_8px_30px_rgba(34,211,238,0.15)]"
          >
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/15 to-cyan-glow/15 text-brand-600 dark:text-cyan-300 group-hover:scale-110 transition-transform">
              <it.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">{it.title}</h3>
            <p className="mt-2 text-sm text-[rgb(var(--muted))] leading-relaxed">{it.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
