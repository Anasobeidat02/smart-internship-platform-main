"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }
  }, [error]);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] grid place-items-center px-4 py-20">
      <div className="relative max-w-lg w-full rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-8 text-center shadow-xl">
        <h1 className="text-xl font-bold tracking-tight">Something went wrong</h1>
        <p className="mt-2 text-sm text-[rgb(var(--muted))]">
          An unexpected error occurred. You can try again, or head back home.
        </p>
        {error.digest && (
          <p className="mt-2 text-[10px] uppercase tracking-wider text-[rgb(var(--muted))]">
            ref: {error.digest}
          </p>
        )}
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center rounded-xl bg-gradient-to-r from-brand-500 to-cyan-glow px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center rounded-xl border border-[rgb(var(--border))] px-5 py-2.5 text-sm font-semibold hover:bg-[rgb(var(--background))]"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
