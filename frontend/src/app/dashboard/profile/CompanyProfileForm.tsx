"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Building2, MapPin } from "lucide-react";

import { useI18n } from "@/components/providers/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { api } from "@/lib/api";
import type { Company } from "@/lib/types";

const HomePicker = dynamic(
  () => import("@/components/map/HomePicker").then((m) => m.HomePicker),
  {
    ssr: false,
    loading: () => (
      <div className="h-80 rounded-xl bg-[rgb(var(--surface))] animate-pulse" />
    ),
  }
);

type CompanyForm = {
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  fields: string;
  training_fields: string;
  city: string;
  governorate: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  website: string;
  logo_url: string;
  size: string;
};

const SIZE_OPTIONS = ["small", "medium", "large", "enterprise"];

export function CompanyProfileForm() {
  const { t, locale } = useI18n();
  const qc = useQueryClient();

  const companyQ = useQuery({
    queryKey: ["my-company"],
    queryFn: () => api<Company>("/companies/me"),
  });

  const [form, setForm] = useState<CompanyForm>({
    name_en: "",
    name_ar: "",
    description_en: "",
    description_ar: "",
    fields: "",
    training_fields: "",
    city: "",
    governorate: "",
    address: "",
    latitude: null,
    longitude: null,
    website: "",
    logo_url: "",
    size: "medium",
  });

  useEffect(() => {
    if (!companyQ.data) return;
    const c = companyQ.data;
    const tf = Array.isArray(c.training_fields)
      ? c.training_fields.join(", ")
      : c.training_fields ?? "";
    setForm({
      name_en: c.name_en ?? "",
      name_ar: c.name_ar ?? "",
      description_en: c.description_en ?? "",
      description_ar: c.description_ar ?? "",
      fields: c.fields ?? "",
      training_fields: tf,
      city: c.city ?? "",
      governorate: c.governorate ?? "",
      address: c.address ?? "",
      latitude: c.latitude ?? null,
      longitude: c.longitude ?? null,
      website: c.website ?? "",
      logo_url: c.logo_url ?? "",
      size: c.size ?? "medium",
    });
  }, [companyQ.data]);

  const mutation = useMutation({
    mutationFn: () =>
      api<Company>("/companies/me", {
        method: "PUT",
        body: {
          name_en: form.name_en,
          name_ar: form.name_ar,
          description_en: form.description_en,
          description_ar: form.description_ar,
          fields: form.fields,
          training_fields: form.training_fields
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .join(", "),
          city: form.city,
          governorate: form.governorate,
          address: form.address,
          latitude: form.latitude ?? 0,
          longitude: form.longitude ?? 0,
          website: form.website || null,
          logo_url: form.logo_url || null,
          size: form.size || "medium",
        },
      }),
    onSuccess: () => {
      toast.success(t.profile.saved);
      qc.invalidateQueries({ queryKey: ["my-company"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (companyQ.isLoading) {
    return <div className="text-sm text-[rgb(var(--muted))]">{t.common.loading}</div>;
  }

  if (companyQ.error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Building2 className="h-10 w-10 text-amber-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold">
            {locale === "ar"
              ? "لا توجد شركة مرتبطة بحسابك"
              : "No company linked to this account"}
          </h2>
          <p className="text-sm text-[rgb(var(--muted))] mt-2">
            {(companyQ.error as Error).message}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Building2 className="h-6 w-6 text-cyan-glow" />
          {locale === "ar" ? "ملف الشركة" : "Company profile"}
        </h1>
        <p className="text-sm text-[rgb(var(--muted))] mt-1">
          {locale === "ar"
            ? "حدّث بيانات شركتك لتظهر للطلاب وللتوصيات الذكية."
            : "Keep your company information up to date so students and the matcher can find you."}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{locale === "ar" ? "الأساسيات" : "Basics"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>{locale === "ar" ? "الاسم (إنجليزي)" : "Name (English)"}</Label>
            <Input
              value={form.name_en}
              onChange={(e) => setForm({ ...form, name_en: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>{locale === "ar" ? "الاسم (عربي)" : "Name (Arabic)"}</Label>
            <Input
              value={form.name_ar}
              onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Label>
              {locale === "ar" ? "وصف الشركة (إنجليزي)" : "Description (English)"}
            </Label>
            <Textarea
              rows={3}
              value={form.description_en}
              onChange={(e) => setForm({ ...form, description_en: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>
              {locale === "ar" ? "وصف الشركة (عربي)" : "Description (Arabic)"}
            </Label>
            <Textarea
              rows={3}
              value={form.description_ar}
              onChange={(e) => setForm({ ...form, description_ar: e.target.value })}
            />
          </div>
          <div>
            <Label>{locale === "ar" ? "الموقع الإلكتروني" : "Website"}</Label>
            <Input
              type="url"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder="https://example.com"
            />
          </div>
          <div>
            <Label>{locale === "ar" ? "حجم الشركة" : "Company size"}</Label>
            <Select
              value={form.size}
              onChange={(e) => setForm({ ...form, size: e.target.value })}
            >
              {SIZE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label>{locale === "ar" ? "رابط الشعار" : "Logo URL"}</Label>
            <Input
              type="url"
              value={form.logo_url}
              onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
              placeholder="https://…/logo.png"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{locale === "ar" ? "المجالات والتدريب" : "Fields & training"}</CardTitle>
          <CardDescription>
            {locale === "ar"
              ? "مفصولة بفواصل، مثل: تطوير الويب، علم البيانات"
              : "Comma-separated. e.g. Web development, Data science"}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div>
            <Label>{locale === "ar" ? "المجالات" : "Industry / fields"}</Label>
            <Input
              value={form.fields}
              onChange={(e) => setForm({ ...form, fields: e.target.value })}
              placeholder="Software, Data, AI"
            />
          </div>
          <div>
            <Label>{locale === "ar" ? "مجالات التدريب" : "Training fields"}</Label>
            <Textarea
              rows={2}
              value={form.training_fields}
              onChange={(e) =>
                setForm({ ...form, training_fields: e.target.value })
              }
              placeholder="Web development, Machine learning, DevOps"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-cyan-glow" />
            {locale === "ar" ? "الموقع" : "Location"}
          </CardTitle>
          <CardDescription>
            {locale === "ar"
              ? "حدّد موقع شركتك على الخريطة"
              : "Pin your company on the map"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>{locale === "ar" ? "المدينة" : "City"}</Label>
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>{locale === "ar" ? "المحافظة" : "Governorate"}</Label>
              <Input
                value={form.governorate}
                onChange={(e) =>
                  setForm({ ...form, governorate: e.target.value })
                }
                required
              />
            </div>
            <div className="sm:col-span-2">
              <Label>{locale === "ar" ? "العنوان" : "Address"}</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
          </div>
          <div className="rounded-xl overflow-hidden">
            <HomePicker
              value={
                form.latitude !== null && form.longitude !== null
                  ? { lat: form.latitude, lng: form.longitude }
                  : null
              }
              onChange={(c) =>
                setForm({ ...form, latitude: c.lat, longitude: c.lng })
              }
              height="360px"
            />
          </div>
          {form.latitude !== null && form.longitude !== null && (
            <div className="text-xs text-[rgb(var(--muted))] font-mono">
              {form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={mutation.isPending}>
          {mutation.isPending ? t.common.loading : t.profile.save}
        </Button>
      </div>
    </form>
  );
}
