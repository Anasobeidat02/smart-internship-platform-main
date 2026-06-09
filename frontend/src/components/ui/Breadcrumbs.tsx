import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";

export interface Crumb {
  href?: string;
  label: string;
}

export function Breadcrumbs({ items, rtl = false }: { items: Crumb[]; rtl?: boolean }) {
  const Chev = rtl ? ChevronLeft : ChevronRight;
  return (
    <nav aria-label="Breadcrumb" className="text-xs">
      <ol className="flex items-center flex-wrap gap-1 text-[rgb(var(--muted))]">
        {items.map((it, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${it.label}-${i}`} className="inline-flex items-center gap-1">
              {it.href && !last ? (
                <Link
                  href={it.href}
                  className="hover:text-[rgb(var(--foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 rounded"
                >
                  {it.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className={last ? "text-[rgb(var(--foreground))] font-medium" : ""}>
                  {it.label}
                </span>
              )}
              {!last && <Chev className="h-3 w-3 opacity-60" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
