import Image from "next/image";
import { cn } from "@/lib/utils";

interface AvatarProps {
  name?: string | null;
  src?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  variant?: "brand" | "gold" | "muted";
}

const sizeMap = {
  xs: "h-7 w-7 text-[10px]",
  sm: "h-9 w-9 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-xl",
};

const variantMap = {
  brand: "from-brand-500 to-cyan-glow",
  gold: "from-gold-500 to-gold-600",
  muted: "from-slate-500 to-slate-700",
};

function initials(name?: string | null): string {
  if (!name) return "??";
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (parts.length === 0) return "??";
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
}

export function Avatar({
  name,
  src,
  size = "md",
  className,
  variant = "brand",
}: AvatarProps) {
  const sz = sizeMap[size];
  if (src) {
    return (
      <div className={cn("relative rounded-full overflow-hidden ring-2 ring-[rgb(var(--border))]", sz, className)}>
        <Image src={src} alt={name ?? ""} fill sizes="80px" className="object-cover" />
      </div>
    );
  }
  return (
    <div
      aria-hidden="true"
      className={cn(
        "inline-flex items-center justify-center rounded-full font-bold text-white bg-gradient-to-br shadow-md",
        variantMap[variant],
        sz,
        className
      )}
    >
      {initials(name)}
    </div>
  );
}
