"use client";

import { AdminTable, Badge, PageHeader, confirmAction } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import type { AdminApplicationRow, ApplicationStatus } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

const STATUSES: ApplicationStatus[] = ["pending", "accepted", "rejected", "withdrawn"];

function statusTone(s: ApplicationStatus): "info" | "success" | "danger" | "warn" {
  if (s === "accepted") return "success";
  if (s === "rejected") return "danger";
  if (s === "withdrawn") return "warn";
  return "info";
}

export default function AdminApplicationsPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "applications"],
    queryFn: () => api<AdminApplicationRow[]>("/admin/applications"),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ApplicationStatus }) =>
      api<{ id: number; status: ApplicationStatus }>(
        `/admin/applications/${id}/status`,
        { method: "PATCH", body: { status } }
      ),
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["admin", "applications"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: number) =>
      api<void>(`/admin/applications/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Application deleted");
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader
        title="Applications"
        subtitle="All apply operations across the platform"
      />
      {isLoading ? (
        <div className="text-sm text-[rgb(var(--muted))]">Loading…</div>
      ) : (
        <AdminTable<AdminApplicationRow>
          rows={data}
          rowKey={(r) => r.id}
          searchPlaceholder="Search by student, company, role…"
          columns={[
            { key: "id", header: "#", className: "w-12 text-[rgb(var(--muted))]" },
            {
              key: "student_name",
              header: "Student",
              render: (r) => (
                <div>
                  <div className="font-medium">{r.student_name || "-"}</div>
                  <div className="text-xs text-[rgb(var(--muted))]">{r.student_email}</div>
                </div>
              ),
            },
            {
              key: "internship_title",
              header: "Internship",
              render: (r) => (
                <div>
                  <div className="font-medium">{r.internship_title}</div>
                  <div className="text-xs text-[rgb(var(--muted))]">{r.company_name}</div>
                </div>
              ),
            },
            {
              key: "match_score",
              header: "Match",
              render: (r) => (
                <Badge tone="info">{(r.match_score * 100).toFixed(0)}%</Badge>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (r) => (
                <select
                  value={r.status}
                  onChange={(e) =>
                    updateStatus.mutate({
                      id: r.id,
                      status: e.target.value as ApplicationStatus,
                    })
                  }
                  className="h-8 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))] px-2 text-xs"
                  disabled={updateStatus.isPending}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              ),
              accessor: (r) => r.status,
            },
            {
              key: "current_status_badge",
              header: "",
              searchable: false,
              render: (r) => (
                <Badge tone={statusTone(r.status)}>{r.status}</Badge>
              ),
            },
            {
              key: "actions",
              header: "",
              searchable: false,
              className: "w-20",
              render: (r) => (
                <Button
                  size="sm"
                  variant="danger"
                  disabled={del.isPending}
                  onClick={async () => {
                    if (await confirmAction(`Delete application #${r.id}?`)) {
                      del.mutate(r.id);
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
