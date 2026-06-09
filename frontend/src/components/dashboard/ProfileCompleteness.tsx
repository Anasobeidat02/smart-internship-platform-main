"use client";

import { useI18n } from "@/components/providers/I18nProvider";
import { api } from "@/lib/api";
import type { StudentProfile } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { Check, CircleDot, UserCog } from "lucide-react";
import Link from "next/link";
import { toList } from "@/lib/utils";

interface Field {
  key: string;
  label_en: string;
  label_ar: string;
  ok: boolean;
}

export function ProfileCompleteness() {
  const { locale } = useI18n();
  const { data, isLoading } = useQuery({
    queryKey: ["student-profile"],
    queryFn: () => api<StudentProfile>("/students/me"),
    retry: false,
  });

  if (isLoading) {
    return <div className="h-32 rounded-2xl bg-[rgb(var(--surface))] animate-pulse" />;
  }
  if (!data) return null;

  const fields: Field[] = [
    { key: "major", label_en: "Major", label_ar: "التخصص", ok: !!data.major },
    { key: "university", label_en: "University", label_ar: "الجامعة", ok: !!data.university_id },
    { key: "skills", label_en: "Skills", label_ar: "المهارات", ok: toList(data.skills).length > 0 },
    { key: "knowledge", label_en: "Knowledge areas", label_ar: "المعرفة", ok: toList(data.knowledge_areas).length > 0 },
    { key: "city", label_en: "City", label_ar: "المدينة", ok: !!data.home_city },
    { key: "home", label_en: "Home location", label_ar: "موقع السكن", ok: data.home_latitude != null && data.home_longitude != null },
  ];

  const done = fields.filter((f) => f.ok).length;
  const pct = Math.round((done / fields.length) * 100);
  const complete = pct === 100;

  return (
    <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-500 to-cyan-glow flex items-center justify-center text-white flex-none">
          <UserCog className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="font-semibold">
              {locale === "ar" ? "اكتمال الملف الشخصي" : "Profile completeness"}
            </h3>
            <span className="text-sm font-bold gradient-text">{pct}%</span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-[rgb(var(--background))] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${complete ? "bg-gradient-to-r from-emerald-400 to-emerald-600" : "bg-gradient-to-r from-brand-500 to-cyan-glow"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
            {fields.map((f) => (
              <li key={f.key} className="flex items-center gap-2 text-xs">
                {f.ok ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500 flex-none" />
                ) : (
                  <CircleDot className="h-3.5 w-3.5 text-[rgb(var(--muted))] flex-none" />
                )}
                <span className={f.ok ? "text-[rgb(var(--muted))] line-through" : ""}>
                  {locale === "ar" ? f.label_ar : f.label_en}
                </span>
              </li>
            ))}
          </ul>
          {!complete && (
            <div className="mt-4">
              <Link
                href="/dashboard/profile"
                className="inline-flex items-center rounded-lg border border-[rgb(var(--border))] px-3 py-1.5 text-xs font-semibold hover:bg-[rgb(var(--background))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                {locale === "ar" ? "أكمل ملفك للحصول على نتائج أفضل" : "Complete profile for better matches"}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
