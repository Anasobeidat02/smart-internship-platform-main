"use client";

import dynamic from "next/dynamic";
import { useI18n } from "@/components/providers/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import type { StudentProfile, University } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MapPin } from "lucide-react";
import { toList } from "@/lib/utils";
import { CompanyProfileForm } from "./CompanyProfileForm";

const HomePicker = dynamic(
  () => import("@/components/map/HomePicker").then((m) => m.HomePicker),
  { ssr: false, loading: () => <div className="h-80 rounded-xl bg-[rgb(var(--surface))] animate-pulse" /> }
);

export default function ProfilePage() {
  const { user } = useAuth();
  if (user?.role === "company") {
    return <CompanyProfileForm />;
  }
  return <StudentProfileForm />;
}

function StudentProfileForm() {
  const { t, locale } = useI18n();
  const qc = useQueryClient();

  const profileQ = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => api<StudentProfile>("/students/me"),
  });
  const unisQ = useQuery({
    queryKey: ["universities"],
    queryFn: () => api<University[]>("/universities/", { auth: false }),
  });

  const [form, setForm] = useState({
    full_name: "",
    major: "",
    university_id: "" as string | number,
    gpa: 0,
    experience_years: 0,
    skills: "",
    knowledge_areas: "",
    home_city: "",
    home_governorate: "",
    home_latitude: null as number | null,
    home_longitude: null as number | null,
  });

  useEffect(() => {
    if (!profileQ.data) return;
    const p = profileQ.data;
    // Sync server data into local form state on first load / refetch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      full_name: p.full_name ?? "",
      major: p.major ?? "",
      university_id: p.university_id ?? "",
      gpa: p.gpa ?? 0,
      experience_years: p.experience_years ?? 0,
      skills: toList(p.skills).join(", "),
      knowledge_areas: toList(p.knowledge_areas).join(", "),
      home_city: p.home_city ?? "",
      home_governorate: p.home_governorate ?? "",
      home_latitude: p.home_latitude,
      home_longitude: p.home_longitude,
    });
  }, [profileQ.data]);

  const mutation = useMutation({
    mutationFn: () =>
      api<StudentProfile>("/students/me", {
        method: "PUT",
        body: {
          full_name: form.full_name,
          major: form.major,
          university_id: form.university_id === "" ? null : Number(form.university_id),
          gpa: Number(form.gpa) || 0,
          experience_years: Number(form.experience_years) || 0,
          skills: form.skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .join(", "),
          knowledge_areas: form.knowledge_areas
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .join(", "),
          home_city: form.home_city,
          home_governorate: form.home_governorate,
          home_latitude: form.home_latitude,
          home_longitude: form.home_longitude,
        },
      }),
    onSuccess: () => {
      toast.success(t.profile.saved);
      qc.invalidateQueries({ queryKey: ["my-profile"] });
      qc.invalidateQueries({ queryKey: ["recommendations"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (profileQ.isLoading) return <div className="text-sm text-[rgb(var(--muted))]">{t.common.loading}</div>;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t.profile.title}</h1>
        <p className="text-sm text-[rgb(var(--muted))] mt-1">{t.profile.subtitle}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.profile.step_basics}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>{t.auth.full_name}</Label>
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Label>{t.profile.major}</Label>
            <Input value={form.major} onChange={(e) => setForm({ ...form, major: e.target.value })} placeholder="Computer Science" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.profile.step_academics}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Label>{t.profile.university}</Label>
            <Select
              value={form.university_id}
              onChange={(e) => setForm({ ...form, university_id: e.target.value })}
            >
              <option value="">-</option>
              {unisQ.data?.map((u) => (
                <option key={u.id} value={u.id}>
                  {locale === "ar" ? u.name_ar : u.name_en} ({u.city})
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>GPA</Label>
            <Input
              type="number"
              step="0.01"
              min={0}
              max={4}
              value={form.gpa}
              onChange={(e) => setForm({ ...form, gpa: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>{t.profile.experience}</Label>
            <Input
              type="number"
              min={0}
              max={20}
              value={form.experience_years}
              onChange={(e) => setForm({ ...form, experience_years: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>{t.profile.city}</Label>
            <Input value={form.home_city} onChange={(e) => setForm({ ...form, home_city: e.target.value })} placeholder="Amman" />
          </div>
          <div>
            <Label>{t.profile.governorate}</Label>
            <Input value={form.home_governorate} onChange={(e) => setForm({ ...form, home_governorate: e.target.value })} placeholder="Amman" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.profile.step_skills}</CardTitle>
          <CardDescription>Comma-separated. e.g. Python, React, SQL, Communication</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div>
            <Label>{t.profile.skills}</Label>
            <Textarea
              rows={2}
              value={form.skills}
              onChange={(e) => setForm({ ...form, skills: e.target.value })}
              placeholder="Python, JavaScript, React, SQL, Git, Communication"
            />
          </div>
          <div>
            <Label>{t.profile.knowledge}</Label>
            <Textarea
              rows={2}
              value={form.knowledge_areas}
              onChange={(e) => setForm({ ...form, knowledge_areas: e.target.value })}
              placeholder="Web development, Data science, Machine learning"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-cyan-glow" />
            {t.profile.step_location}
          </CardTitle>
          <CardDescription>{t.profile.pick_home}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl overflow-hidden">
            <HomePicker
              value={form.home_latitude !== null && form.home_longitude !== null ? { lat: form.home_latitude, lng: form.home_longitude } : null}
              onChange={(c) => setForm({ ...form, home_latitude: c.lat, home_longitude: c.lng })}
              height="360px"
            />
          </div>
          {form.home_latitude !== null && form.home_longitude !== null && (
            <div className="mt-3 text-xs text-[rgb(var(--muted))] font-mono">
              {form.home_latitude.toFixed(4)}, {form.home_longitude.toFixed(4)}
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
