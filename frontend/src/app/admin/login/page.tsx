"use client";

import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { api, setTokens } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import type { TokenPair, User } from "@/lib/types";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, KeyRound, UserCog, Eye, EyeOff } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const setUser = useAuth((s) => s.setUser);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const mutation = useMutation({
  mutationFn: async () => {
    // محاولة إرسال الطلب الحقيقي للباكيند
    const tokens = await api<TokenPair>("/auth/login", {
      method: "POST",
      body: { 
        email: username, 
        password: password 
      }, 
      auth: false,
    });

    setTokens(tokens);

    // جلب بيانات الأدمن الحقيقية لتجنب التعليق
    const me = await api<User>("/auth/me");

    setUser(me);
    return me;
  },
  onSuccess: () => {
    toast.success("Welcome, Admin ✓");
   window.location.href = "/admin"; // التوجيه الصحيح للوحة التحكم
  },
  onError: (e: Error) => {
    toast.error(e.message || "Invalid credentials");
  },
});

  return (
    <div className="relative min-h-[calc(100vh-4rem)] grid place-items-center px-4 py-12 overflow-hidden">
      <div className="aurora" />
      <div className="relative w-full max-w-md rounded-3xl p-8 shadow-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))]/90 backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-6">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 text-white shadow-lg">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Admin Control Panel</h1>
            <p className="text-xs text-[rgb(var(--muted))]">
              Restricted access · authorised personnel only
            </p>
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
            <Label htmlFor="admin-username">Username</Label>
            <div className="relative">
              <UserCog className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgb(var(--muted))] pointer-events-none" />
              <Input
                id="admin-username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-9"
                placeholder="Admin"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="admin-password">Password</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgb(var(--muted))] pointer-events-none" />
              <Input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 pr-10"
                placeholder="••••••••"
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
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Signing in…" : "Sign in to Admin"}
          </Button>
        </form>

        <p className="mt-6 text-[11px] leading-relaxed text-[rgb(var(--muted))]">
          All admin actions are logged. Unauthorised attempts trigger rate
          limiting and lockout.
        </p>
      </div>
    </div>
  );
}
