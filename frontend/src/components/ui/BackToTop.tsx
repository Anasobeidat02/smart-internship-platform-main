"use client";

import { ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";

export function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!show) return null;
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className="fixed bottom-6 end-6 z-30 inline-flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-cyan-glow text-white shadow-2xl shadow-cyan-glow/30 hover:scale-110 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
    >
      <ChevronUp className="h-5 w-5" />
    </button>
  );
}
