"use client";

import { useI18n } from "@/components/providers/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { api, setTokens } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import type { TokenPair, User } from "@/lib/types";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, Building2, Eye, EyeOff } from "lucide-react";

/** Map each role to its post-login destination. */
function dashboardFor(role: User["role"]): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "company":
      return "/dashboard/company";
    default:
      return "/dashboard";
  }
}

export default function LoginPage() {
  const { t } = useI18n();
  const router = useRouter();
  const setUser = useAuth((s) => s.setUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const isDev = process.env.NODE_ENV !== "production";

  // التعديل لدالة الـ mutation لتكون آمنة وتتحقق بدقة من قاعدة البيانات
  const mutation = useMutation({
    mutationFn: async () => {
      if (!email || !password) {
        throw new Error(t.auth.email_password_required);
      }

      // إرسال طلب حقيقي للباكيند للتحقق من وجود الحساب وصحة البيانات
      const tokens = await api<TokenPair>("/auth/login", {
        method: "POST",
        body: { email, password },
        auth: false,
      });
      
      setTokens(tokens);

      // جلب بيانات المستخدم الحقيقية من الباكيند
      const userPayload = await api<User>("/auth/me");

      setUser(userPayload);
      return userPayload;
    },
    onSuccess: (u) => {
      toast.success(t.auth.login_success);
      
      if (u.role === "company") {
        router.push("/dashboard/company"); // 👈 يفتح لوحة الشركة الحقيقية (الطلبات والوظائف)
      } else if (u.role === "admin") {
        router.push("/admin");   // 👈 يفتح لوحة الأدمن الحقيقية
      } else {
        router.push("/dashboard/profile");// 👈 يفتح لوحة الطالب الحقيقية
      }
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
  });
  return (
    <div className="relative min-h-[calc(100vh-4rem)] grid place-items-center px-4 py-12 overflow-hidden">
      <div className="aurora" />
      <div className="relative w-full max-w-md glass rounded-3xl p-8 shadow-2xl">
        <div className="flex items-center gap-2 mb-6">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-cyan-glow text-white">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{t.auth.signin_title}</h1>
            <p className="text-xs text-[rgb(var(--muted))]">{t.auth.signin_subtitle}</p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="email">{t.auth.email}</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="password">{t.auth.password}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pe-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))] focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? t.common.loading : t.auth.submit_signin}
          </Button>
        </form>

        <div className="mt-5 text-center text-sm text-[rgb(var(--muted))]">
          {t.auth.no_account}{" "}
          <Link href="/register" className="font-semibold text-brand-600 dark:text-brand-300 hover:underline">
            {t.auth.sign_up_link}
          </Link>
        </div>

        {/* Secondary sign-in links */}
       {/* <div className="mt-3 flex items-center justify-center gap-4 text-xs text-[rgb(var(--muted))]">
          <span className="flex items-center gap-1">
            <Building2 className="h-3.5 w-3.5" />
            Company?{" "}
            <Link
              href="/register?role=company"
              className="font-semibold text-cyan-600 dark:text-cyan-300 hover:underline ml-0.5"
            >
              Register your company
            </Link>
          </span>
          <span aria-hidden="true" className="opacity-40">·</span>
          <Link href="/admin/login" className="font-semibold text-rose-600 dark:text-rose-300 hover:underline">
            Admin sign-in
          </Link>
        </div>
        */}

        {isDev && (
          <div className="mt-6 pt-5 border-t border-[rgb(var(--border))] text-xs text-[rgb(var(--muted))]">
            <p className="font-semibold mb-2">Demo accounts (dev only):</p>
            <div className="grid gap-1.5">
              <button
                type="button"
                onClick={() => { setEmail("demo.student@smartintern.jo"); setPassword("demo123!"); }}
                className="text-start rounded-lg border border-[rgb(var(--border))] px-2.5 py-1.5 hover:bg-[rgb(var(--surface))]"
              >
                Student · demo.student@smartintern.jo
              </button>

              <button
                type="button"
                id="demo-company-btn"
                onClick={() => { setEmail("demo.company@smartintern.jo"); setPassword("demo123!"); }}
                className="text-start rounded-lg border border-[rgb(var(--border))] px-2.5 py-1.5 hover:bg-[rgb(var(--surface))] flex items-center gap-1.5"
              >
                <Building2 className="h-3 w-3 text-cyan-500" />
                Company · demo.company@smartintern.jo
              </button>

              <button
                type="button"
                onClick={() => { setEmail("admin@smartintern.jo"); setPassword("admin123!"); }}
                className="text-start rounded-lg border border-[rgb(var(--border))] px-2.5 py-1.5 hover:bg-[rgb(var(--surface))]"
              >
                Admin · admin@smartintern.jo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
