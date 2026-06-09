"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "./types";

interface AuthState {
  user: User | null;
  hydrated: boolean;
  setUser: (u: User | null) => void;
  setHydrated: () => void;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      hydrated: false,
      setUser: (u) => set({ user: u }),
      setHydrated: () => set({ hydrated: true }),
      logout: () => {
        if (typeof window !== "undefined") {
          const refresh = window.localStorage.getItem("refresh_token");
          if (refresh) {
            const base = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";
            // fire-and-forget; ignore network errors
            fetch(`${base}/auth/logout`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refresh_token: refresh }),
              keepalive: true,
            }).catch(() => {});
          }
          window.localStorage.removeItem("access_token");
          window.localStorage.removeItem("refresh_token");
        }
        set({ user: null });
      },
    }),
    {
      name: "smartintern-auth",
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
