"use client";

import { AdminTable, Badge, PageHeader, confirmAction } from "@/components/admin/AdminTable";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import type { AdminStudentRow } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminStudentsPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "students"],
    queryFn: () => api<AdminStudentRow[]>("/admin/students"),
  });

  const del = useMutation({
    mutationFn: (userId: number) =>
      api<void>(`/admin/users/${userId}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Student account deleted");
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader
        title="Students"
        subtitle="Profiles, academic information and skills"
      />
      {isLoading ? (
        <div className="text-sm text-[rgb(var(--muted))]">Loading…</div>
      ) : (
        <AdminTable<AdminStudentRow>
          rows={data}
          rowKey={(r) => r.id}
          searchPlaceholder="Search by name, email, major, skills…"
          columns={[
            {
              key: "full_name",
              header: "Student",
              render: (r) => (
                <div>
                  <div className="font-medium">{r.full_name || "-"}</div>
                  <div className="text-xs text-[rgb(var(--muted))]">{r.email}</div>
                </div>
              ),
            },
            { key: "major", header: "Major", render: (r) => r.major || "-" },
            {
              key: "university_name",
              header: "Institute",
              render: (r) => r.university_name || "-",
            },
            {
              key: "gpa",
              header: "GPA",
              render: (r) => (r.gpa ? r.gpa.toFixed(2) : "-"),
            },
            {
              key: "experience_years",
              header: "Exp (yrs)",
              render: (r) => r.experience_years,
            },
            {
              key: "skills",
              header: "Skills",
              render: (r) => (
                <div className="flex flex-wrap gap-1 max-w-xs">
                  {r.skills
                    ? r.skills
                        .split(",")
                        .filter(Boolean)
                        .slice(0, 5)
                        .map((s, i) => (
                          <Badge key={i} tone="info">
                            {s.trim()}
                          </Badge>
                        ))
                    : "-"}
                </div>
              ),
            },
            {
              key: "home_governorate",
              header: "Location",
              render: (r) =>
                [r.home_city, r.home_governorate].filter(Boolean).join(", ") || "-",
            },
            {
              key: "is_active",
              header: "Status",
              render: (r) => (
                <Badge tone={r.is_active ? "success" : "warn"}>
                  {r.is_active ? "Active" : "Disabled"}
                </Badge>
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
                    if (
                      await confirmAction(
                        `Delete student ${r.full_name || r.email}? All their applications will be removed.`
                      )
                    ) {
                      del.mutate(r.user_id);
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
