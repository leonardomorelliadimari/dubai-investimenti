"use client";
import Lenis from "lenis";
import { createContext, useContext, useEffect, useRef, useState } from "react";

const LenisContext = createContext<Lenis | null>(null);
export const useLenis = () => useContext(LenisContext);

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const raf = useRef<number>(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const l = new Lenis({ lerp: 0.16, smoothWheel: true, wheelMultiplier: 1.1 });
    setLenis(l);
    const loop = (t: number) => {
      l.raf(t);
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf.current);
      l.destroy();
      setLenis(null);
    };
  }, []);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}

/** Scroll verso un'ancora rispettando Lenis e la navbar. */
export function useScrollTo() {
  const lenis = useLenis();
  return (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: 0, duration: 1.6 });
    else el.scrollIntoView({ behavior: "smooth" });
    history.replaceState(null, "", `#${id}`);
  };
}
