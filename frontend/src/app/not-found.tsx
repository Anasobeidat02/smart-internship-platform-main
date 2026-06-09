import Link from "next/link";
import { Compass, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] grid place-items-center px-4 py-20 overflow-hidden">
      <div className="aurora" />
      <div className="relative text-center max-w-xl">
        <div className="mx-auto mb-6 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-500 to-cyan-glow text-white shadow-2xl shadow-cyan-glow/30">
          <Compass className="h-10 w-10" />
        </div>
        <div className="text-7xl font-black bg-gradient-to-r from-brand-500 to-cyan-glow bg-clip-text text-transparent leading-none">
          404
        </div>
        <h1 className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight">
          Page not found
        </h1>
        <p className="mt-2 text-[rgb(var(--muted))]">
          The page you’re looking for doesn’t exist or has moved. Try one of the links below.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-cyan-glow px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            <Home className="h-4 w-4" />
            Go home
          </Link>
          <Link
            href="/internships"
            className="inline-flex items-center gap-2 rounded-xl border border-[rgb(var(--border))] px-5 py-2.5 text-sm font-semibold hover:bg-[rgb(var(--surface))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            <Search className="h-4 w-4" />
            Browse internships
          </Link>
        </div>
      </div>
    </div>
  );
}
