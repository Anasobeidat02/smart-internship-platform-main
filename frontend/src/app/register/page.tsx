"use client";

import { useI18n } from "@/components/providers/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { api, setTokens } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import type { TokenPair, User } from "@/lib/types";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const { t } = useI18n();
  const router = useRouter();
  const setUser = useAuth((s) => s.setUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [full_name, setFullName] = useState("");
  const [role, setRole] = useState<"student" | "company">("student");

  const mutation = useMutation({
    mutationFn: async () => {
      const hasMinLength = password.length >= 8;
      const hasUppercase = /[A-Z]/.test(password);
      const hasLowercase = /[a-z]/.test(password);
      const hasSymbol = /[^A-Za-z0-9]/.test(password);

      if (!hasMinLength || !hasUppercase || !hasLowercase || !hasSymbol) {
        throw new Error(t.auth.password_validation_error);
      }

      const tokens = await api<TokenPair>("/auth/register", {
        method: "POST",
        body: { email, password, full_name, role },
        auth: false,
      });
      setTokens(tokens);
      const me = await api<User>("/auth/me");
      setUser(me);
      return me;
    },
    onSuccess: () => {
      toast.success(t.auth.register_success);
      router.push("/dashboard");
    },
    onError: (e: Error) => toast.error(e.message),
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
            <h1 className="text-xl font-bold tracking-tight">{t.auth.signup_title}</h1>
            <p className="text-xs text-[rgb(var(--muted))]">{t.auth.signup_subtitle}</p>
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
            <Label>{t.auth.full_name}</Label>
            <Input required value={full_name} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <Label>{t.auth.email}</Label>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label>{t.auth.password}</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
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
          <div>
            <Label>{t.auth.role}</Label>
            <Select value={role} onChange={(e) => setRole(e.target.value as "student" | "company")}>
              <option value="student">{t.auth.role_student}</option>
              <option value="company">{t.auth.role_company}</option>
            </Select>
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? t.common.loading : t.auth.submit_signup}
          </Button>
        </form>

        <div className="mt-5 text-center text-sm text-[rgb(var(--muted))]">
          {t.auth.have_account}{" "}
          <Link href="/login" className="font-semibold text-brand-600 dark:text-brand-300 hover:underline">
            {t.auth.sign_in_link}
          </Link>
        </div>
      </div>
    </div>
  );
}
