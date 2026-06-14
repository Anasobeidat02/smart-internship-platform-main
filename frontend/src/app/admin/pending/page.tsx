"use client";

import { AdminTable, PageHeader, confirmAction } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import type { AdminPendingCompanyRow } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";

export default function PendingApprovalsPage() {
  const qc = useQueryClient();

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "pending-companies"],
    queryFn: () => api<AdminPendingCompanyRow[]>("/admin/pending-companies"),
  });

  const approve = useMutation({
    mutationFn: (id: number) =>
      api<{ id: number; is_approved: boolean }>(`/admin/pending-companies/${id}/approve`, {
        method: "POST",
      }),
    onSuccess: () => {
      toast.success("Company approved successfully ✓");
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reject = useMutation({
    mutationFn: (id: number) =>
      api<{ deleted: boolean }>(`/admin/pending-companies/${id}/reject`, {
        method: "POST",
      }),
    onSuccess: () => {
      toast.success("Company rejected and deleted ✓");
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader
        title="Pending Approvals"
        subtitle="Review and approve self-registered companies before they go public"
      />
      {isLoading ? (
        <div className="text-sm text-[rgb(var(--muted))]">Loading…</div>
      ) : (
        <AdminTable<AdminPendingCompanyRow>
          rows={data}
          rowKey={(r) => r.id}
          searchPlaceholder="Search by name, city, industry…"
          emptyMessage="No pending company approvals found"
          columns={[
            {
              key: "name_en",
              header: "Name",
              render: (r) => (
                <div>
                  <div className="font-medium">{r.name_en}</div>
                  <div className="text-xs text-[rgb(var(--muted))]">{r.name_ar}</div>
                </div>
              ),
            },
            {
              key: "email",
              header: "Email",
              render: (r) => r.email || "-",
            },
            {
              key: "governorate",
              header: "Location",
              render: (r) =>
                [r.city, r.governorate].filter(Boolean).join(", ") || "-",
            },
            {
              key: "industry",
              header: "Industry",
              render: (r) => r.industry || "-",
            },
            {
              key: "size",
              header: "Size",
              className: "capitalize",
              render: (r) => r.size || "-",
            },
            {
              key: "created_at",
              header: "Registered On",
              render: (r) =>
                r.created_at ? new Date(r.created_at).toLocaleDateString() : "-",
            },
            {
              key: "actions",
              header: "Actions",
              searchable: false,
              className: "w-48",
              render: (r) => (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-105 transition-transform"
                    disabled={approve.isPending || reject.isPending}
                    onClick={async () => {
                      if (
                        await confirmAction(
                          `Approve ${r.name_en}? They will be active and visible to everyone.`
                        )
                      ) {
                        approve.mutate(r.id);
                      }
                    }}
                  >
                    <Check className="h-3.5 w-3.5" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    className="hover:scale-105 transition-transform"
                    disabled={approve.isPending || reject.isPending}
                    onClick={async () => {
                      if (
                        await confirmAction(
                          `Reject and DELETE ${r.name_en}? This action cannot be undone.`
                        )
                      ) {
                        reject.mutate(r.id);
                      }
                    }}
                  >
                    <X className="h-3.5 w-3.5" /> Reject
                  </Button>
                </div>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
