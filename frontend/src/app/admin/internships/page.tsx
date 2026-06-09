"use client";

import { AdminTable, Badge, PageHeader, confirmAction } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/components/providers/I18nProvider";
import { api } from "@/lib/api";
import type { AdminCompanyRow, AdminInternshipRow } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Briefcase,
  Building2,
  Check,
  ChevronDown,
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
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

interface FormState {
  company_id: string;
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
  company_id: "",
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

// ─── Field helpers ────────────────────────────────────────────────────────────

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

const inputCls =
  "w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--background))] px-3.5 py-2.5 text-sm text-[rgb(var(--foreground))] placeholder:text-[rgb(var(--muted))] focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25 transition-colors";

const textareaCls =
  "w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--background))] px-3.5 py-2.5 text-sm text-[rgb(var(--foreground))] placeholder:text-[rgb(var(--muted))] focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25 transition-colors resize-none min-h-[80px]";

// ─── Toggle Card ──────────────────────────────────────────────────────────────

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

// ─── Modal ────────────────────────────────────────────────────────────────────

// ─── Modal ────────────────────────────────────────────────────────────────────

function InternshipModal({
  open,
  onClose,
  companies,
  onSaved,
  internship,
}: {
  open: boolean;
  onClose: () => void;
  companies: AdminCompanyRow[];
  onSaved: () => void;
  internship?: AdminInternshipRow | null;
}) {
  const { t } = useI18n();
  const i = t.adminInternships;

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const overlayRef = useRef<HTMLDivElement>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      if (internship) {
        setForm({
          company_id: String(internship.company_id),
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

  // Close on Escape
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

  const createMutation = useMutation({
    mutationFn: (body: object) => {
      if (internship) {
        return api<AdminInternshipRow>(`/admin/internships/${internship.id}`, { method: "PUT", body });
      }
      return api<AdminInternshipRow>("/admin/internships", { method: "POST", body });
    },
    onSuccess: (saved) => {
      const msg = internship ? "Internship updated successfully ✓" : `${i.toastCreated} — "${saved.title_ar || saved.title_en}"`;
      toast.success(msg);
      qc.invalidateQueries({ queryKey: ["admin"] });
      onSaved();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function validate(): boolean {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.company_id) errs.company_id = i.errCompany;
    if (!form.title_en.trim()) errs.title_en = i.errTitleEn;
    if (!form.title_ar.trim()) errs.title_ar = i.errTitleAr;
    const dw = parseInt(form.duration_weeks, 10);
    if (isNaN(dw) || dw < 1 || dw > 104) errs.duration_weeks = i.errDuration;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    createMutation.mutate({
      company_id: parseInt(form.company_id, 10),
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

  const modalTitle = internship ? "Edit Internship" : i.modalTitle;
  const modalSubtitle = internship ? "تعديل بيانات التدريب" : i.modalSubtitle;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--background))] shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[rgb(var(--border))] bg-[rgb(var(--background))]/95 backdrop-blur-md px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-cyan-glow text-white shadow-lg">
              {internship ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </div>
            <div>
              <h2 className="font-bold text-base leading-tight">{modalTitle}</h2>
              <p className="text-xs text-[rgb(var(--muted))] mt-0.5">{modalSubtitle}</p>
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
          {/* Company selector */}
          <Field label={i.fieldCompany} required hint={i.fieldCompanyHint}>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgb(var(--muted))]" />
              <select
                value={form.company_id}
                onChange={(e) => set("company_id", e.target.value)}
                className={`${inputCls} pl-9 appearance-none`}
              >
                <option value="">{i.fieldCompanyPlaceholder}</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name_en} {c.is_strategic_partner ? "★" : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgb(var(--muted))]" />
            </div>
            {errors.company_id && (
              <p className="text-xs text-rose-500 mt-1">{errors.company_id}</p>
            )}
          </Field>

          {/* Title row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={i.fieldTitleAr} required>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgb(var(--muted))]" />
                <input
                  dir="rtl"
                  type="text"
                  placeholder={i.fieldTitleArPlaceholder}
                  value={form.title_ar}
                  onChange={(e) => set("title_ar", e.target.value)}
                  className={`${inputCls} pl-9`}
                />
              </div>
              {errors.title_ar && (
                <p className="text-xs text-rose-500 mt-1">{errors.title_ar}</p>
              )}
            </Field>

            <Field label={i.fieldTitleEn} required>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgb(var(--muted))]" />
                <input
                  dir="ltr"
                  type="text"
                  placeholder={i.fieldTitleEnPlaceholder}
                  value={form.title_en}
                  onChange={(e) => set("title_en", e.target.value)}
                  className={`${inputCls} pl-9`}
                />
              </div>
              {errors.title_en && (
                <p className="text-xs text-rose-500 mt-1">{errors.title_en}</p>
              )}
            </Field>
          </div>

          {/* Description row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={i.fieldDescAr}>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-[rgb(var(--muted))]" />
                <textarea
                  dir="rtl"
                  placeholder={i.fieldDescArPlaceholder}
                  value={form.description_ar}
                  onChange={(e) => set("description_ar", e.target.value)}
                  className={`${textareaCls} pl-9`}
                />
              </div>
            </Field>

            <Field label={i.fieldDescEn}>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-[rgb(var(--muted))]" />
                <textarea
                  dir="ltr"
                  placeholder={i.fieldDescEnPlaceholder}
                  value={form.description_en}
                  onChange={(e) => set("description_en", e.target.value)}
                  className={`${textareaCls} pl-9`}
                />
              </div>
            </Field>
          </div>

          {/* Requirements / Skills */}
          <Field label={i.fieldSkills} hint={i.fieldSkillsHint}>
            <div className="relative">
              <Star className="absolute left-3 top-3 h-4 w-4 text-[rgb(var(--muted))]" />
              <textarea
                placeholder={i.fieldSkillsPlaceholder}
                value={form.required_skills}
                onChange={(e) => set("required_skills", e.target.value)}
                className={`${textareaCls} pl-9 min-h-[64px]`}
              />
            </div>
          </Field>

          {/* Duration & Experience row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={i.fieldDuration} required>
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
              {errors.duration_weeks && (
                <p className="text-xs text-rose-500 mt-1">{errors.duration_weeks}</p>
              )}
            </Field>

            <Field label={i.fieldExperience}>
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

          {/* Toggle row */}
          <div className="grid grid-cols-2 gap-4">
            <ToggleCard
              icon={<WifiOff className="h-4 w-4" />}
              label={i.toggleRemote}
              checked={form.is_remote}
              onChange={(v) => set("is_remote", v)}
            />
            <ToggleCard
              icon={<Check className="h-4 w-4" />}
              label={i.toggleOpen}
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
              disabled={createMutation.isPending}
            >
              {i.btnCancel}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createMutation.isPending}
              className="min-w-[140px]"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {i.btnSubmitting}
                </>
              ) : (
                <>
                  {internship ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {internship ? "Save Changes" : i.btnSubmit}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminInternshipsPage() {
  const { t } = useI18n();
  const i = t.adminInternships;
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingInternship, setEditingInternship] = useState<AdminInternshipRow | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "internships"],
    queryFn: () => api<AdminInternshipRow[]>("/admin/internships"),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["admin", "companies"],
    queryFn: () => api<AdminCompanyRow[]>("/admin/companies"),
  });

  const del = useMutation({
    mutationFn: (id: number) =>
      api<void>(`/admin/internships/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Internship deleted");
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader
        title="Internships"
        subtitle={`${data.length} posting${data.length !== 1 ? "s" : ""} across all corporates`}
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditingInternship(null);
              setShowModal(true);
            }}
            id="btn-add-internship"
          >
            <Plus className="h-4 w-4" />
            {i.addBtn}
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-[rgb(var(--muted))]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </div>
      ) : (
        <AdminTable<AdminInternshipRow>
          rows={data}
          rowKey={(r) => r.id}
          searchPlaceholder="Search by title, company…"
          columns={[
            {
              key: "title_en",
              header: "Title",
              render: (r) => (
                <div>
                  <div className="font-medium">{r.title_en}</div>
                  <div className="text-xs text-[rgb(var(--muted))]">{r.title_ar}</div>
                </div>
              ),
            },
            { key: "company_name", header: "Corporate" },
            {
              key: "duration_weeks",
              header: "Duration",
              render: (r) => `${r.duration_weeks} wks`,
            },
            {
              key: "is_remote",
              header: "Mode",
              render: (r) => (
                <Badge tone={r.is_remote ? "info" : "default"}>
                  {r.is_remote ? "Remote" : "On-site"}
                </Badge>
              ),
            },
            {
              key: "is_open",
              header: "Status",
              render: (r) => (
                <Badge tone={r.is_open ? "success" : "warn"}>
                  {r.is_open ? "Open" : "Closed"}
                </Badge>
              ),
            },
            {
              key: "applications_count",
              header: "Apps",
              render: (r) => <Badge>{r.applications_count}</Badge>,
            },
            {
              key: "actions",
              header: "",
              searchable: false,
              className: "w-28",
              render: (r) => (
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingInternship(r);
                      setShowModal(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={del.isPending}
                    onClick={async () => {
                      if (
                        await confirmAction(
                          `Delete internship "${r.title_en}"? All applications to this role will be removed.`
                        )
                      ) {
                        del.mutate(r.id);
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ),
            },
          ]}
        />
      )}

      <InternshipModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingInternship(null);
        }}
        companies={companies}
        onSaved={() => qc.invalidateQueries({ queryKey: ["admin"] })}
        internship={editingInternship}
      />
    </div>
  );
}
