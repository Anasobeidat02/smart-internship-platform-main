"use client";

import { useI18n } from "@/components/providers/I18nProvider";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth-store";
import { Bell, Globe2, Moon, Settings, User } from "lucide-react";

export default function SettingsPage() {
  const { t, locale, setLocale } = useI18n();
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6 text-cyan-glow" />
          {t.nav.settings}
        </h1>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">
          {locale === "ar"
            ? "خصّص تجربتك في سمارت إنترن."
            : "Customize your SmartIntern experience."}
        </p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-cyan-glow" />
            <h2 className="font-semibold">{locale === "ar" ? "الحساب" : "Account"}</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <Field label={t.auth.email} value={user?.email ?? "-"} />
            <Field label={t.auth.full_name} value={user?.full_name ?? "-"} />
            <Field label={t.auth.role} value={user?.role ?? "-"} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Globe2 className="h-4 w-4 text-cyan-glow" />
            <h2 className="font-semibold">{locale === "ar" ? "اللغة" : "Language"}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={locale === "en" ? "primary" : "outline"}
              size="sm"
              onClick={() => setLocale("en")}
            >
              English
            </Button>
            <Button
              variant={locale === "ar" ? "primary" : "outline"}
              size="sm"
              onClick={() => setLocale("ar")}
            >
              العربية
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4 text-cyan-glow" />
            <h2 className="font-semibold">{locale === "ar" ? "المظهر" : "Appearance"}</h2>
          </div>
          <p className="text-sm text-[rgb(var(--muted))]">
            {locale === "ar"
              ? "الوضع الداكن مفعّل تلقائياً. الوضع الفاتح قادم قريباً."
              : "Dark mode is enabled by default. Light theme coming soon."}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-cyan-glow" />
            <h2 className="font-semibold">{locale === "ar" ? "الإشعارات" : "Notifications"}</h2>
          </div>
          <p className="text-sm text-[rgb(var(--muted))]">
            {locale === "ar"
              ? "إشعارات البريد الإلكتروني للطلبات قادمة قريباً."
              : "Email notifications for application updates are coming soon."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--background))] p-3">
      <div className="text-[10px] uppercase tracking-wider text-[rgb(var(--muted))]">{label}</div>
      <div className="mt-1 text-sm font-medium truncate">{value}</div>
    </div>
  );
}
