"use client";

import { AdminTable, Badge, PageHeader, confirmAction } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import type { AdminCompanyRow } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Loader2, Plus, Star, Trash2, X, Pencil } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// ─── Add Company Modal ────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--background))] px-3.5 py-2.5 text-sm placeholder:text-[rgb(var(--muted))] focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25 transition-colors";

function CompanyModal({
  open,
  onClose,
  company,
}: {
  open: boolean;
  onClose: () => void;
  company?: AdminCompanyRow | null;
}) {
  const qc = useQueryClient();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState({
    name_en: "", name_ar: "", city: "Amman", governorate: "Amman",
    industry: "", size: "medium", website: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (company) {
        setForm({
          name_en: company.name_en || "",
          name_ar: company.name_ar || "",
          city: company.city || "Amman",
          governorate: company.governorate || "Amman",
          industry: company.industry || "",
          size: company.size || "medium",
          website: company.website || "",
        });
      } else {
        setForm({
          name_en: "", name_ar: "", city: "Amman", governorate: "Amman",
          industry: "", size: "medium", website: "",
        });
      }
      setErrors({});
    }
  }, [open, company]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  const mut = useMutation({
    mutationFn: (body: object) => {
      if (company) {
        return api<AdminCompanyRow>(`/admin/companies/${company.id}`, { method: "PUT", body });
      }
      return api<AdminCompanyRow>("/admin/companies", { method: "POST", body });
    },
    onSuccess: () => {
      toast.success(company ? "Corporate updated ✓" : "Corporate created ✓");
      qc.invalidateQueries({ queryKey: ["admin", "companies"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.name_en.trim()) errs.name_en = "English name is required";
    if (!form.name_ar.trim()) errs.name_ar = "Arabic name is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    mut.mutate({ ...form, website: form.website || undefined });
  }

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  if (!open) return null;
  return (
    <div ref={overlayRef} onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--background))] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[rgb(var(--border))] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-cyan-glow text-white">
              {company ? <Pencil className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
            </div>
            <h2 className="font-bold">{company ? "Edit Corporate" : "Add New Corporate"}</h2>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[rgb(var(--surface))] text-[rgb(var(--muted))]">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Name (English) <span className="text-rose-500">*</span></label>
              <input type="text" className={inputCls} value={form.name_en} onChange={(e) => set("name_en", e.target.value)} placeholder="Company Inc." />
              {errors.name_en && <p className="text-xs text-rose-500">{errors.name_en}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">الاسم (عربي) <span className="text-rose-500">*</span></label>
              <input dir="rtl" type="text" className={inputCls} value={form.name_ar} onChange={(e) => set("name_ar", e.target.value)} placeholder="شركة..." />
              {errors.name_ar && <p className="text-xs text-rose-500">{errors.name_ar}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">City</label>
              <input type="text" className={inputCls} value={form.city} onChange={(e) => set("city", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Governorate</label>
              <input type="text" className={inputCls} value={form.governorate} onChange={(e) => set("governorate", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Industry / Field</label>
              <input type="text" className={inputCls} value={form.industry} onChange={(e) => set("industry", e.target.value)} placeholder="IT, AI, Finance…" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Size</label>
              <select className={inputCls} value={form.size} onChange={(e) => set("size", e.target.value)}>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Website</label>
            <input type="url" className={inputCls} value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://example.com" />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-[rgb(var(--border))]">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={mut.isPending}>Cancel</Button>
            <Button type="submit" size="sm" disabled={mut.isPending}>
              {mut.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <>{company ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />} {company ? "Save Changes" : "Add Corporate"}</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AdminCompaniesPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<AdminCompanyRow | null>(null);
  
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "companies"],
    queryFn: () => api<AdminCompanyRow[]>("/admin/companies"),
  });

  const toggleStrategic = useMutation({
    mutationFn: (id: number) =>
      api<{ id: number; is_strategic_partner: boolean }>(`/admin/companies/${id}/toggle-strategic`, { method: "POST" }),
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: number) => api<void>(`/admin/companies/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Corporate deleted");
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader
        title="Corporates"
        subtitle="All partner companies, their internships and applications"
        actions={
          <Button size="sm" onClick={() => { setEditingCompany(null); setShowModal(true); }} id="btn-add-company">
            <Plus className="h-4 w-4" /> Add Corporate
          </Button>
        }
      />
      {isLoading ? (
        <div className="text-sm text-[rgb(var(--muted))]">Loading…</div>
      ) : (
        <AdminTable<AdminCompanyRow>
          rows={data}
          rowKey={(r) => r.id}
          searchPlaceholder="Search by name, city, industry…"
          columns={[
            {
              key: "name_en",
              header: "Name",
              render: (r) => (
                <div>
                  <div className="font-medium flex items-center gap-1.5">
                    {r.name_en}
                    {r.is_strategic_partner && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
                  </div>
                  <div className="text-xs text-[rgb(var(--muted))]">{r.name_ar}</div>
                </div>
              ),
            },
            { key: "industry", header: "Industry", render: (r) => r.industry || "-" },
            { key: "governorate", header: "Location", render: (r) => [r.city, r.governorate].filter(Boolean).join(", ") || "-" },
            { key: "size", header: "Size", className: "capitalize" },
            { key: "open_internships", header: "Open roles", render: (r) => <Badge tone="info">{r.open_internships}</Badge> },
            { key: "applications_count", header: "Applications", render: (r) => <Badge>{r.applications_count}</Badge> },
            { key: "is_strategic_partner", header: "Strategic", render: (r) => <Badge tone={r.is_strategic_partner ? "warn" : "default"}>{r.is_strategic_partner ? "Yes" : "No"}</Badge> },
            {
              key: "actions",
              header: "Actions",
              searchable: false,
              className: "w-64",
              render: (r) => (
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setEditingCompany(r); setShowModal(true); }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toggleStrategic.mutate(r.id)} disabled={toggleStrategic.isPending}>
                    <Star className="h-3.5 w-3.5" />
                    {r.is_strategic_partner ? "Unmark" : "Mark"}
                  </Button>
                  <Button size="sm" variant="danger" disabled={del.isPending}
                    onClick={async () => {
                      if (await confirmAction(`Delete corporate ${r.name_en}? This removes all its internships and applications.`)) {
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
      <CompanyModal open={showModal} onClose={() => { setShowModal(false); setEditingCompany(null); }} company={editingCompany} />
    </div>
  );
}
