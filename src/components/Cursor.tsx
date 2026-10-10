"use client";
import { useEffect, useRef } from "react";
import { useFinePointer, useReducedMotion } from "@/hooks/useMediaQuery";

/**
 * Cursore discreto che segue il puntatore senza ritardo:
 * posizionamento diretto via transform (nessun re-render React, nessuna molla).
 */
export function Cursor() {
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const enabled = fine && !reduced;

  useEffect(() => {
    if (!enabled) return;
    document.documentElement.classList.add("has-custom-cursor");
    const move = (e: PointerEvent) => {
      const t = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      if (dot.current) { dot.current.style.transform = t; dot.current.style.opacity = "1"; }
      const h = !!(e.target as HTMLElement | null)?.closest('a, button, [role="button"], [role="tab"], [data-cursor="hover"], input, label, select, textarea');
      if (ring.current) {
        ring.current.style.transform = `${t} scale(${h ? 1.8 : 1})`;
        ring.current.style.opacity = "1";
      }
    };
    const leave = () => { if (dot.current) dot.current.style.opacity = "0"; if (ring.current) ring.current.style.opacity = "0"; };
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      document.documentElement.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed left-0 top-0 z-[100] h-0 w-0 overflow-visible mix-blend-difference">
      <div ref={dot} className="absolute left-0 top-0 -ml-[3px] -mt-[3px] h-1.5 w-1.5 rounded-full bg-white opacity-0 will-change-transform" />
      <div ref={ring} className="absolute left-0 top-0 -ml-4 -mt-4 h-8 w-8 rounded-full border border-white/80 opacity-0 will-change-transform transition-[width,height] duration-200" />
    </div>
  );
}
