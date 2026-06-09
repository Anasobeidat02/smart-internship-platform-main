"use client";

import { useI18n } from "@/components/providers/I18nProvider";
import { Badge, Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Label, Textarea } from "@/components/ui/Input";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import type { Application, InternshipWithCompany, StudentProfile } from "@/lib/types";
import { googleEarthUrl, googleMapsDirectionsUrl, googleMapsSearchUrl, toList, getDistanceKm } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Briefcase, Building2, Clock, Globe2, MapPin, Navigation, Sparkles, Wifi, Car, Bus } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

export default function InternshipDetailPage() {
  const { t, locale } = useI18n();
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);
  const router = useRouter();
  const { user, hydrated } = useAuth();
  const qc = useQueryClient();
  const [coverLetter, setCoverLetter] = useState("");
  const [showApply, setShowApply] = useState(false);

  const { data: it, isLoading, error } = useQuery({
    queryKey: ["internship", id],
    queryFn: () => api<InternshipWithCompany>(`/internships/${id}`, { auth: false }),
    enabled: Number.isFinite(id),
  });

  const profileQ = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => api<StudentProfile>("/students/me"),
    enabled: hydrated && user?.role === "student",
    retry: false,
  });

  const applyMutation = useMutation({
    mutationFn: () =>
      api<Application>("/applications/", {
        method: "POST",
        body: { internship_id: id, cover_letter: coverLetter },
      }),
    onSuccess: () => {
      toast.success(locale === "ar" ? "تم إرسال طلبك" : "Application submitted");
      setShowApply(false);
      setCoverLetter("");
      qc.invalidateQueries({ queryKey: ["my-applications"] });
      router.push("/applications");
    },
    onError: (e: Error) => {
      const msg =
        e instanceof ApiError && e.status === 401
          ? locale === "ar" ? "سجّل الدخول للتقديم" : "Please sign in to apply"
          : e.message;
      toast.error(msg);
      if (e instanceof ApiError && e.status === 401) router.push("/login");
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="h-64 rounded-2xl bg-[rgb(var(--surface))] animate-pulse" />
      </div>
    );
  }

  if (error || !it) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-sm text-[rgb(var(--muted))]">
              {(error as Error)?.message ?? (locale === "ar" ? "لم نتمكن من العثور على هذه الفرصة" : "Internship not found")}
            </p>
            <Link href="/internships" className="mt-4 inline-block">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4" /> {locale === "ar" ? "كل الفرص" : "All internships"}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const company = it.company;
  const title = locale === "ar" ? it.title_ar : it.title_en;
  const desc = locale === "ar" ? it.description_ar : it.description_en;
  const cname = locale === "ar" ? company.name_ar : company.name_en;
  const canApply = hydrated && user?.role === "student";

  const hasHome =
    profileQ.data?.home_latitude != null &&
    profileQ.data?.home_longitude != null;
  
  const distance = hasHome
    ? getDistanceKm(
        profileQ.data!.home_latitude!,
        profileQ.data!.home_longitude!,
        company.latitude,
        company.longitude
      )
    : 0;

  const carTime = Math.round(distance * 1.33 + 5);
  const transitTime = Math.round(distance * 3 + 10);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
      <Breadcrumbs
        rtl={locale === "ar"}
        items={[
          { href: "/", label: t.nav.home },
          { href: "/internships", label: t.nav.internships },
          { label: title },
        ]}
      />
      <Link href="/internships" className="mt-2 inline-flex items-center gap-1 text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))]">
        <ArrowLeft className="h-4 w-4" /> {locale === "ar" ? "كل الفرص" : "All internships"}
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {company.is_strategic_partner && <Badge variant="gold"><Sparkles className="h-3 w-3" /> {t.partner.kicker}</Badge>}
              {it.is_remote && <Badge variant="cyan"><Wifi className="h-3 w-3" /> {locale === "ar" ? "عن بُعد" : "Remote"}</Badge>}
              {!it.is_open && <Badge variant="outline">{locale === "ar" ? "مغلق" : "Closed"}</Badge>}
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">{title}</h1>
            <p className="mt-1 text-[rgb(var(--muted))] flex items-center gap-2 flex-wrap">
              <Building2 className="h-4 w-4" />
              <Link href={`/companies`} className="hover:underline">{cname}</Link>
              <span>·</span>
              <MapPin className="h-3.5 w-3.5" />
              {company.city}, {company.governorate}
            </p>
          </div>

          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <h2 className="font-semibold mb-2">{locale === "ar" ? "نظرة عامة" : "Overview"}</h2>
                <p className="text-sm whitespace-pre-line text-[rgb(var(--muted))]">{desc}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-[rgb(var(--background))] border border-[rgb(var(--border))] p-3">
                  <div className="text-[11px] uppercase tracking-wider text-[rgb(var(--muted))]">{locale === "ar" ? "المدة" : "Duration"}</div>
                  <div className="font-semibold mt-0.5 flex items-center gap-1">
                    <Clock className="h-4 w-4 text-cyan-glow" />
                    {it.duration_weeks} {locale === "ar" ? "أسابيع" : "weeks"}
                  </div>
                </div>
                <div className="rounded-xl bg-[rgb(var(--background))] border border-[rgb(var(--border))] p-3">
                  <div className="text-[11px] uppercase tracking-wider text-[rgb(var(--muted))]">{locale === "ar" ? "الخبرة المطلوبة" : "Experience"}</div>
                  <div className="font-semibold mt-0.5">
                    {it.required_experience > 0
                      ? `${it.required_experience}+ ${locale === "ar" ? "سنة" : "yr"}`
                      : locale === "ar" ? "بدون خبرة" : "No experience"}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-sm">{locale === "ar" ? "المهارات المطلوبة" : "Required skills"}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {toList(it.required_skills).map((s) => (
                    <Badge key={s} variant="cyan">{s}</Badge>
                  ))}
                </div>
              </div>

              {toList(it.knowledge_areas).length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 text-sm">{locale === "ar" ? "مجالات المعرفة" : "Knowledge areas"}</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {toList(it.knowledge_areas).map((s) => (
                      <Badge key={s} variant="default">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-3">
          <Card>
            <CardContent className="p-5 space-y-3">
              <Button
                className="w-full"
                size="lg"
                disabled={!it.is_open}
                onClick={() => {
                  if (!user) { router.push("/login"); return; }
                  if (user.role !== "student") {
                    toast.error(locale === "ar" ? "فقط الطلاب يمكنهم التقديم" : "Only students can apply");
                    return;
                  }
                  setShowApply(true);
                }}
              >
                <Briefcase className="h-4 w-4" />
                {!it.is_open
                  ? (locale === "ar" ? "التقديم مغلق" : "Applications closed")
                  : canApply
                    ? (locale === "ar" ? "قدّم الآن" : "Apply now")
                    : (locale === "ar" ? "سجّل دخول للتقديم" : "Sign in to apply")}
              </Button>

              <a
                href={googleEarthUrl({
                  name: company.name_en,
                  address: company.address,
                  city: company.city,
                  governorate: company.governorate,
                  latitude: company.latitude,
                  longitude: company.longitude,
                }, company.is_strategic_partner ? 400 : 650)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 px-3 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-900/30 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                <Globe2 className="h-4 w-4" />
                {t.map.open_satellite}
              </a>

              <a
                href={googleMapsDirectionsUrl(
                  {
                    name: company.name_en,
                    address: company.address,
                    city: company.city,
                    governorate: company.governorate,
                    latitude: company.latitude,
                    longitude: company.longitude,
                  },
                  hasHome
                    ? {
                        lat: profileQ.data!.home_latitude!,
                        lng: profileQ.data!.home_longitude!,
                      }
                    : null
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-[rgb(var(--border))] py-2.5 text-sm font-semibold hover:bg-[rgb(var(--surface))]"
              >
                <Navigation className="h-4 w-4" />
                {locale === "ar" ? "الاتجاهات" : "Directions"}
              </a>

              <a
                href={googleMapsSearchUrl({
                  name: company.name_en,
                  address: company.address,
                  city: company.city,
                  governorate: company.governorate,
                  latitude: company.latitude,
                  longitude: company.longitude,
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-[rgb(var(--border))] py-2.5 text-sm font-semibold hover:bg-[rgb(var(--surface))]"
              >
                <MapPin className="h-4 w-4" />
                {locale === "ar" ? "افتح في خرائط جوجل" : "Open in Google Maps"}
              </a>
            </CardContent>
          </Card>

          {hasHome && (
            <Card className="border-[rgb(var(--border))] bg-gradient-to-br from-[rgb(var(--surface))] to-cyan-950/20 shadow-md">
              <CardContent className="p-5 space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-1.5 text-cyan-200">
                  <Navigation className="h-4 w-4 text-cyan-400" />
                  {locale === "ar" ? "معلومات المسافة والوصول" : "Distance & Commute"}
                </h3>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-xl bg-white/5 border border-white/5 p-2">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                      {locale === "ar" ? "المسافة" : "Distance"}
                    </div>
                    <div className="font-bold text-cyan-300">
                      {distance.toFixed(1)} km
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/5 p-2">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 flex justify-center items-center gap-1">
                      <Car className="h-3 w-3 text-cyan-400" />
                      {locale === "ar" ? "سيارة" : "Drive"}
                    </div>
                    <div className="font-bold text-cyan-300">
                      {carTime} {locale === "ar" ? "د" : "min"}
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/5 p-2">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 flex justify-center items-center gap-1">
                      <Bus className="h-3 w-3 text-cyan-400" />
                      {locale === "ar" ? "حافلة" : "Transit"}
                    </div>
                    <div className="font-bold text-cyan-300">
                      {transitTime} {locale === "ar" ? "د" : "min"}
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 text-center">
                  {locale === "ar"
                    ? "المسافة محسوبة من موقع سكنك المسجل في الملف الشخصي."
                    : "Distance calculated from your registered home location."}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-5">
              <h3 className="font-semibold text-sm">{locale === "ar" ? "عن الشركة" : "About the company"}</h3>
              <p className="mt-2 text-xs text-[rgb(var(--muted))] line-clamp-6">
                {locale === "ar" ? company.description_ar : company.description_en}
              </p>
              {company.website && (
                <a href={company.website} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-xs font-semibold text-brand-600 dark:text-brand-300 hover:underline">
                  {company.website.replace(/^https?:\/\//, "")}
                </a>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>

      {showApply && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowApply(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--background))] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold">{locale === "ar" ? "قدّم على هذه الفرصة" : "Apply for this internship"}</h2>
            <p className="text-sm text-[rgb(var(--muted))] mt-1">{title}</p>
            <div className="mt-4">
              <Label htmlFor="cl">{locale === "ar" ? "خطاب التغطية (اختياري)" : "Cover letter (optional)"}</Label>
              <Textarea
                id="cl"
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value.slice(0, 2000))}
                placeholder={locale === "ar" ? "أخبر الشركة لماذا أنت مناسب لهذه الفرصة..." : "Tell the company why you are a great fit..."}
                className="min-h-32"
              />
              <div className="mt-1 text-[11px] text-[rgb(var(--muted))] text-end">{coverLetter.length} / 2000</div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowApply(false)} disabled={applyMutation.isPending}>
                {t.common.cancel}
              </Button>
              <Button onClick={() => applyMutation.mutate()} disabled={applyMutation.isPending}>
                {applyMutation.isPending ? t.common.loading : (locale === "ar" ? "إرسال" : "Submit application")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
