"use client";

import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/providers/I18nProvider";
import {
  Building2,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  School2,
  ShieldCheck,
  Sparkles,
  Briefcase,
  ScrollText,
  Users,
  ClipboardCheck,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import type { Dictionary } from "@/lib/i18n";

const NAV: readonly { href: string; key: keyof Dictionary["admin"]; icon: React.ComponentType<any>; exact?: boolean }[] = [
  { href: "/admin", key: "navOverview", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", key: "navUsers", icon: Users },
  { href: "/admin/students", key: "navStudents", icon: GraduationCap },
  { href: "/admin/companies", key: "navCorporates", icon: Building2 },
  { href: "/admin/pending", key: "navPending", icon: ClipboardCheck },
  { href: "/admin/universities", key: "navInstitutes", icon: School2 },
  { href: "/admin/internships", key: "navInternships", icon: Briefcase },
  { href: "/admin/applications", key: "navApplications", icon: ScrollText },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const router = useRouter();
  const path = usePathname();
  const { user, setUser, hydrated, logout } = useAuth();

  const isLoginPage = path === "/admin/login";

  useEffect(() => {
    if (isLoginPage) return;
    if (!hydrated) return;
    if (user) {
      if (user.role !== "admin") {
        router.replace("/admin/login");
      }
      return;
    }
    if (typeof window !== "undefined" && window.localStorage.getItem("access_token")) {
      api<User>("/auth/me")
        .then((u) => {
          if (u.role === "admin") setUser(u);
          else router.replace("/admin/login");
        })
        .catch(() => router.replace("/admin/login"));
    } else {
      router.replace("/admin/login");
    }
  }, [hydrated, user, setUser, router, isLoginPage]);

  if (isLoginPage) return <>{children}</>;

  if (!hydrated || !user || user.role !== "admin") {
    return (
      <div className="grid place-items-center min-h-[calc(100vh-4rem)]">
        <div className="flex items-center gap-2 text-[rgb(var(--muted))] text-sm">
          <ShieldCheck className="h-4 w-4 animate-pulse" />
          {t.admin.verifyingSession}
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.replace("/admin/login");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-2">
          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-lg">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm truncate">{t.admin.adminConsole}</div>
                <div className="text-[11px] text-[rgb(var(--muted))] uppercase tracking-wider truncate">
                  {user.email}
                </div>
              </div>
            </div>
          </div>

          <nav className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-2">
            {NAV.map((it) => {
              const active = it.exact ? path === it.href : path?.startsWith(it.href);
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-rose-500/10 text-rose-600 dark:text-rose-300"
                      : "text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))] hover:bg-[rgb(var(--background))]"
                  )}
                >
                  <it.icon className="h-4 w-4" />
                  {t.admin[it.key]}
                </Link>
              );
            })}
          </nav>

          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))]"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {t.admin.backToSite}
          </Link>

          <Button variant="outline" className="w-full" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            {t.admin.signOut}
          </Button>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
