"use client";

import { useI18n } from "@/components/providers/I18nProvider";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth-store";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Compass, UserCircle2, Sparkles, LogOut, Briefcase, Heart, Settings, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const path = usePathname();
  const { user, setUser, hydrated, logout } = useAuth();

  useEffect(() => {
    if (!hydrated) return;
    if (user) {
      // Redirect admins to their dedicated panel
      if (user.role === "admin" && !path?.startsWith("/admin")) {
        router.replace("/admin");
      }
      // Companies have a dedicated applications page
      if (user.role === "company" && path === "/dashboard") {
        router.replace("/dashboard/company");
      }
      return;
    }
    // Try to fetch /auth/me using stored token
    if (typeof window !== "undefined" && window.localStorage.getItem("access_token")) {
      api<User>("/auth/me")
        .then(setUser)
        .catch(() => router.replace("/login"));
    } else {
      router.replace("/login");
    }
  }, [hydrated, user, setUser, router, path]);

  if (!hydrated || !user) {
    return (
      <div className="grid place-items-center min-h-[calc(100vh-4rem)]">
        <div className="text-[rgb(var(--muted))] text-sm">{t.common.loading}</div>
      </div>
    );
  }

  const isCompany = user.role === "company";
  const items = [
    { href: "/dashboard", label: t.dashboard.recommendations, icon: Compass, exact: true, show: user.role === "student" },
    { href: "/dashboard/company", label: locale === "ar" ? "طلبات التدريب" : "Received Applications", icon: Briefcase, show: isCompany },
    { href: "/dashboard/profile", label: isCompany ? (locale === "ar" ? "ملف الشركة" : "Company profile") : t.dashboard.profile, icon: isCompany ? Building2 : UserCircle2, show: user.role === "student" || isCompany },
    { href: "/applications", label: t.nav.applications, icon: Briefcase, show: user.role === "student" },
    { href: "/saved", label: t.nav.saved, icon: Heart, show: true },
    { href: "/dashboard/settings", label: t.nav.settings, icon: Settings, show: true },
  ].filter((i) => i.show);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-2">
          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-500 to-cyan-glow flex items-center justify-center text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm truncate">{user.full_name ?? user.email}</div>
                <div className="text-[11px] text-[rgb(var(--muted))] uppercase tracking-wider">{user.role}</div>
              </div>
            </div>
          </div>

          <nav className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-2">
            {items.map((it) => {
              const active = it.exact ? path === it.href : path?.startsWith(it.href);
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-brand-500/10 text-brand-600 dark:text-brand-300"
                      : "text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))] hover:bg-[rgb(var(--background))]"
                  )}
                >
                  <it.icon className="h-4 w-4" />
                  {it.label}
                </Link>
              );
            })}
          </nav>

          <Button variant="outline" className="w-full" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4" />
            {t.nav.logout}
          </Button>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
