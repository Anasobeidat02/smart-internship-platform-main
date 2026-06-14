"use client";

import { useI18n } from "@/components/providers/I18nProvider";
import { Badge, PageHeader, confirmAction } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import type { Company, Internship, InternshipWithCompany } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Briefcase,
  Check,
  Clock,
  FileText,
  Loader2,
  Plus,
  Settings2,
  Star,
  Trash2,
  WifiOff,
  X,
  Pencil,
  AlertTriangle,
  Search,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Form State and Initial Value ─────────────────────────────────────────────

interface FormState {
  title_en: string;
  title_ar: string;
  description_en: string;
  description_ar: string;
  required_skills: string;
  knowledge_areas: string;
  required_experience: string;
  duration_weeks: string;
  is_remote: boolean;
  is_open: boolean;
}

const EMPTY_FORM: FormState = {
  title_en: "",
  title_ar: "",
  description_en: "",
  description_ar: "",
  required_skills: "",
  knowledge_areas: "",
  required_experience: "0",
  duration_weeks: "12",
  is_remote: false,
  is_open: true,
};

const inputCls =
  "w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--background))] px-3.5 py-2.5 text-sm text-[rgb(var(--foreground))] placeholder:text-[rgb(var(--muted))] focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25 transition-colors";

const textareaCls =
  "w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--background))] px-3.5 py-2.5 text-sm text-[rgb(var(--foreground))] placeholder:text-[rgb(var(--muted))] focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25 transition-colors resize-none min-h-[80px]";

function Field({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-[rgb(var(--foreground))]">
        {label}
        {required && <span className="ml-1 text-rose-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-[rgb(var(--muted))]">{hint}</p>}
    </div>
  );
}

function ToggleCard({
  icon,
  label,
  checked,
  onChange,
  activeColor = "brand",
}: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  activeColor?: "brand" | "emerald";
}) {
  const activeCls =
    activeColor === "emerald"
      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : "border-brand-500/50 bg-brand-500/10 text-brand-600 dark:text-brand-300";

  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
        checked
          ? activeCls
          : "border-[rgb(var(--border))] text-[rgb(var(--muted))] hover:bg-[rgb(var(--surface))]"
      }`}
    >
      <div
        className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all ${
          checked
            ? activeColor === "emerald"
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-brand-500 bg-brand-500 text-white"
            : "border-[rgb(var(--border))] bg-[rgb(var(--background))]"
        }`}
      >
        {checked && <Check className="h-3 w-3" />}
      </div>
      <span className="flex items-center gap-1.5">
        {icon}
        {label}
      </span>
    </button>
  );
}

// ─── Internship Modal ──────────────────────────────────────────────────────────

interface InternshipModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  internship?: Internship | null;
  locale: string;
}

function InternshipModal({
  open,
  onClose,
  onSaved,
  internship,
  locale,
}: InternshipModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      if (internship) {
        setForm({
          title_en: internship.title_en || "",
          title_ar: internship.title_ar || "",
          description_en: internship.description_en || "",
          description_ar: internship.description_ar || "",
          required_skills: internship.required_skills || "",
          knowledge_areas: internship.knowledge_areas || "",
          required_experience: String(internship.required_experience || 0),
          duration_weeks: String(internship.duration_weeks || 12),
          is_remote: !!internship.is_remote,
          is_open: !!internship.is_open,
        });
      } else {
        setForm(EMPTY_FORM);
      }
      setErrors({});
    }
  }, [open, internship]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const set = (key: keyof FormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: (body: object) => {
      if (internship) {
        return api<Internship>(`/internships/${internship.id}`, { method: "PUT", body });
      }
      return api<Internship>("/internships", { method: "POST", body });
    },
    onSuccess: (saved) => {
      const msg = internship
        ? (locale === "ar" ? "تم تحديث الفرصة بنجاح ✓" : "Internship updated successfully ✓")
        : (locale === "ar" ? `تم إنشاء فرصة تدريب جديدة: "${saved.title_ar || saved.title_en}"` : `Internship created: "${saved.title_en || saved.title_ar}"`);
      toast.success(msg);
      qc.invalidateQueries({ queryKey: ["my-internships"] });
      onSaved();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function validate(): boolean {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.title_en.trim()) {
      errs.title_en = locale === "ar" ? "العنوان بالإنجليزية مطلوب" : "English title is required";
    }
    if (!form.title_ar.trim()) {
      errs.title_ar = locale === "ar" ? "العنوان بالعربية مطلوب" : "Arabic title is required";
    }
    const dw = parseInt(form.duration_weeks, 10);
    if (isNaN(dw) || dw < 1 || dw > 104) {
      errs.duration_weeks = locale === "ar" ? "المدة يجب أن تكون بين 1 و 104 أسابيع" : "Duration must be between 1 and 104 weeks";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    mut.mutate({
      title_en: form.title_en.trim(),
      title_ar: form.title_ar.trim(),
      description_en: form.description_en.trim(),
      description_ar: form.description_ar.trim(),
      required_skills: form.required_skills.trim(),
      knowledge_areas: form.knowledge_areas.trim(),
      required_experience: parseInt(form.required_experience, 10) || 0,
      duration_weeks: parseInt(form.duration_weeks, 10),
      is_remote: form.is_remote,
      is_open: form.is_open,
    });
  }

  if (!open) return null;

  const isAr = locale === "ar";

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--background))] shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[rgb(var(--border))] bg-[rgb(var(--background))]/95 backdrop-blur-md px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-cyan-glow text-white shadow-lg">
              {internship ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </div>
            <div>
              <h2 className="font-bold text-base leading-tight">
                {internship ? (isAr ? "تعديل فرصة التدريب" : "Edit Internship") : (isAr ? "إضافة فرصة تدريب جديدة" : "Add New Internship")}
              </h2>
              <p className="text-xs text-[rgb(var(--muted))] mt-0.5">
                {internship ? (isAr ? "قم بتعديل تفاصيل الفرصة أدناه" : "Update the internship details below") : (isAr ? "املأ البيانات لنشر فرصة جديدة للطلاب" : "Fill in details to post a new internship opportunity")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[rgb(var(--surface))] transition-colors text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={isAr ? "العنوان بالعربية" : "Title (Arabic)"} required>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgb(var(--muted))]" />
                <input
                  dir="rtl"
                  type="text"
                  placeholder={isAr ? "مثال: مطور ويب متكامل" : "e.g. مطور ويب متكامل"}
                  value={form.title_ar}
                  onChange={(e) => set("title_ar", e.target.value)}
                  className={`${inputCls} pl-9`}
                />
              </div>
              {errors.title_ar && <p className="text-xs text-rose-500 mt-1">{errors.title_ar}</p>}
            </Field>

            <Field label={isAr ? "العنوان بالإنجليزية" : "Title (English)"} required>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgb(var(--muted))]" />
                <input
                  dir="ltr"
                  type="text"
                  placeholder="e.g. Full-Stack Developer Intern"
                  value={form.title_en}
                  onChange={(e) => set("title_en", e.target.value)}
                  className={`${inputCls} pl-9`}
                />
              </div>
              {errors.title_en && <p className="text-xs text-rose-500 mt-1">{errors.title_en}</p>}
            </Field>
          </div>

          {/* Description row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={isAr ? "الوصف بالعربية" : "Description (Arabic)"}>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-[rgb(var(--muted))]" />
                <textarea
                  dir="rtl"
                  placeholder={isAr ? "اكتب تفاصيل ومسؤوليات التدريب هنا..." : "اكتب تفاصيل ومسؤوليات التدريب هنا..."}
                  value={form.description_ar}
                  onChange={(e) => set("description_ar", e.target.value)}
                  className={`${textareaCls} pl-9`}
                />
              </div>
            </Field>

            <Field label={isAr ? "الوصف بالإنجليزية" : "Description (English)"}>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-[rgb(var(--muted))]" />
                <textarea
                  dir="ltr"
                  placeholder="Write the responsibilities and requirements in English..."
                  value={form.description_en}
                  onChange={(e) => set("description_en", e.target.value)}
                  className={`${textareaCls} pl-9`}
                />
              </div>
            </Field>
          </div>

          {/* Requirements / Skills & Knowledge Areas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={isAr ? "المهارات المطلوبة" : "Required Skills"} hint={isAr ? "افصل بينها بفواصل (مثال: React, Node.js, SQL)" : "Comma-separated (e.g. React, Node.js, SQL)"}>
              <div className="relative">
                <Star className="absolute left-3 top-3 h-4 w-4 text-[rgb(var(--muted))]" />
                <textarea
                  placeholder="React, TypeScript, CSS, Git"
                  value={form.required_skills}
                  onChange={(e) => set("required_skills", e.target.value)}
                  className={`${textareaCls} pl-9 min-h-[64px]`}
                />
              </div>
            </Field>

            <Field label={isAr ? "مجالات المعرفة" : "Knowledge Areas"} hint={isAr ? "مجال التدريب العام (مثال: Web development, AI, Marketing)" : "General domain (e.g. Web development, AI, Marketing)"}>
              <div className="relative">
                <Settings2 className="absolute left-3 top-3 h-4 w-4 text-[rgb(var(--muted))]" />
                <textarea
                  placeholder="Backend, Software Engineering"
                  value={form.knowledge_areas}
                  onChange={(e) => set("knowledge_areas", e.target.value)}
                  className={`${textareaCls} pl-9 min-h-[64px]`}
                />
              </div>
            </Field>
          </div>

          {/* Duration & Experience row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={isAr ? "المدة (بالأسابيع)" : "Duration (Weeks)"} required>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgb(var(--muted))]" />
                <input
                  type="number"
                  min={1}
                  max={104}
                  value={form.duration_weeks}
                  onChange={(e) => set("duration_weeks", e.target.value)}
                  className={`${inputCls} pl-9`}
                />
              </div>
              {errors.duration_weeks && <p className="text-xs text-rose-500 mt-1">{errors.duration_weeks}</p>}
            </Field>

            <Field label={isAr ? "سنوات الخبرة المطلوبة" : "Required Experience (Years)"}>
              <div className="relative">
                <Settings2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgb(var(--muted))]" />
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={form.required_experience}
                  onChange={(e) => set("required_experience", e.target.value)}
                  className={`${inputCls} pl-9`}
                />
              </div>
            </Field>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-2 gap-4">
            <ToggleCard
              icon={<WifiOff className="h-4 w-4" />}
              label={isAr ? "تدريب عن بعد" : "Remote"}
              checked={form.is_remote}
              onChange={(v) => set("is_remote", v)}
            />
            <ToggleCard
              icon={<Check className="h-4 w-4" />}
              label={isAr ? "مفتوح للتقديم" : "Open Status"}
              checked={form.is_open}
              onChange={(v) => set("is_open", v)}
              activeColor="emerald"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-[rgb(var(--border))]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={mut.isPending}
            >
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={mut.isPending}
              className="min-w-[140px]"
            >
              {mut.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isAr ? "جاري الحفظ..." : "Saving..."}
                </>
              ) : (
                <>
                  {internship ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {internship ? (isAr ? "حفظ التغييرات" : "Save Changes") : (isAr ? "نشر الفرصة" : "Post Internship")}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CompanyInternshipsPage() {
  const { locale } = useI18n();
  const { user, hydrated } = useAuth();
  const qc = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [editingInternship, setEditingInternship] = useState<Internship | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const isAr = locale === "ar";

  // 1. Fetch current company information to check approval status
  const { data: company, isLoading: loadingCompany } = useQuery({
    queryKey: ["my-company"],
    queryFn: () => api<Company>("/companies/me"),
    enabled: hydrated && user?.role === "company",
  });

  // 2. Fetch company internships (only possible if company is fetched)
  const { data: internships = [], isLoading: loadingInternships } = useQuery({
    queryKey: ["my-internships", company?.id],
    queryFn: () =>
      api<InternshipWithCompany[]>(`/internships/?company_id=${company?.id}&open_only=false`, {
        auth: false,
      }),
    enabled: !!company?.id && company.is_approved,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api<void>(`/internships/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success(isAr ? "تم حذف فرصة التدريب بنجاح" : "Internship deleted successfully");
      qc.invalidateQueries({ queryKey: ["my-internships"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!hydrated || loadingCompany) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-glow" />
      </div>
    );
  }

  const isApproved = company?.is_approved ?? false;

  const filteredInternships = internships.filter((intern) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      intern.title_en.toLowerCase().includes(q) ||
      intern.title_ar.toLowerCase().includes(q) ||
      intern.required_skills.toLowerCase().includes(q) ||
      intern.knowledge_areas.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Briefcase className="h-7 w-7 text-cyan-glow" />
            {isAr ? "فرص التدريب الخاصة بالشركة" : "Manage Internships"}
          </h1>
          <p className="mt-2 text-[rgb(var(--muted))] text-sm">
            {isAr
              ? "قم بإضافة، تعديل أو إغلاق فرص التدريب التي تقدمها شركتك"
              : "Post, modify or close the internship roles offered by your company"}
          </p>
        </div>

        {isApproved && (
          <Button
            size="sm"
            onClick={() => {
              setEditingInternship(null);
              setShowModal(true);
            }}
          >
            <Plus className="h-4 w-4" />
            {isAr ? "إضافة فرصة تدريب" : "Add Internship"}
          </Button>
        )}
      </div>

      {/* Pending approval banner */}
      {!isApproved && (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5 flex items-start gap-4">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-amber-800 dark:text-amber-300">
              {isAr ? "حسابك قيد المراجعة والتدقيق" : "Your account is pending review"}
            </h3>
            <p className="text-sm text-amber-700/80 dark:text-amber-300/80">
              {isAr
                ? "حساب الشركة الخاص بك مسجل بنجاح ولكنه بانتظار موافقة المسؤول (Admin). بمجرد تفعيل الحساب، ستتمكن من نشر فرص التدريب وتلقي الطلبات من الطلاب. شكراً لصبرك."
                : "Your company account registration is complete and is currently awaiting approval from the platform administrator. You will be able to manage and publish internship opportunities once your account is activated."}
            </p>
          </div>
        </div>
      )}

      {isApproved && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgb(var(--muted))]" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAr ? "ابحث عن فرصة تدريب..." : "Search internships..."}
                className="h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] pl-9 pr-3 text-sm focus:border-cyan-glow focus:outline-none focus:ring-2 focus:ring-cyan-glow/30"
              />
            </div>
            <div className="text-xs text-[rgb(var(--muted))] font-medium">
              {filteredInternships.length} / {internships.length}
            </div>
          </div>

          {/* List / Table */}
          {loadingInternships ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-cyan-glow" />
            </div>
          ) : filteredInternships.length === 0 ? (
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-10 text-center">
              <Briefcase className="h-10 w-10 mx-auto text-[rgb(var(--muted))]" />
              <h3 className="mt-3 font-semibold text-sm">
                {isAr ? "لا توجد فرص تدريب معروضة" : "No internships found"}
              </h3>
              <p className="text-xs text-[rgb(var(--muted))] mt-1">
                {isAr
                  ? "ابدأ بإضافة فرص تدريب لجذب الطلاب المتميزين."
                  : "Start posting opportunities to attract talented student applicants."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))]">
              <table className="w-full text-sm">
                <thead className="bg-[rgb(var(--background))]/60">
                  <tr className="border-b border-[rgb(var(--border))]">
                    <th className="text-start px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">
                      {isAr ? "المسمى الوظيفي" : "Title"}
                    </th>
                    <th className="text-start px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">
                      {isAr ? "المدة" : "Duration"}
                    </th>
                    <th className="text-start px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">
                      {isAr ? "نوع التدريب" : "Mode"}
                    </th>
                    <th className="text-start px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">
                      {isAr ? "الحالة" : "Status"}
                    </th>
                    <th className="text-end px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">
                      {isAr ? "إجراءات" : "Actions"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgb(var(--border))]">
                  {filteredInternships.map((intern) => (
                    <tr
                      key={intern.id}
                      className="hover:bg-[rgb(var(--background))]/40 transition-colors"
                    >
                      <td className="px-4 py-3 align-middle">
                        <div>
                          <div className="font-semibold text-sm">
                            {isAr ? intern.title_ar : intern.title_en}
                          </div>
                          <div className="text-xs text-[rgb(var(--muted))] mt-0.5">
                            {isAr ? intern.title_en : intern.title_ar}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle font-medium text-xs">
                        {intern.duration_weeks} {isAr ? "أسبوع" : "weeks"}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <Badge tone={intern.is_remote ? "info" : "default"}>
                          {intern.is_remote ? (isAr ? "عن بعد" : "Remote") : (isAr ? "حضوري" : "On-site")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <Badge tone={intern.is_open ? "success" : "warn"}>
                          {intern.is_open ? (isAr ? "مفتوح" : "Open") : (isAr ? "مغلق" : "Closed")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 align-middle text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingInternship(intern);
                              setShowModal(true);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            disabled={deleteMutation.isPending}
                            onClick={async () => {
                              const confirmMsg = isAr
                                ? `هل أنت متأكد من حذف فرصة التدريب "${intern.title_ar}"؟`
                                : `Are you sure you want to delete "${intern.title_en}"?`;
                              if (await confirmAction(confirmMsg)) {
                                deleteMutation.mutate(intern.id);
                              }
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <InternshipModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingInternship(null);
        }}
        onSaved={() => qc.invalidateQueries({ queryKey: ["my-internships"] })}
        internship={editingInternship}
        locale={locale}
      />
    </div>
  );
}
