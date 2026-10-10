"use client";
import { useScroll } from "framer-motion";
import { useCallback, useRef } from "react";
import { registerChapter, type ChapterId } from "./store";

/** Registra una sezione come capitolo 3D e ne restituisce il progresso di scroll (0–1). */
export function useChapter(id: ChapterId) {
  const el = useRef<HTMLElement | null>(null);
  const ref = useCallback((node: HTMLElement | null) => { el.current = node; registerChapter(id, node); }, [id]);
  const { scrollYProgress } = useScroll({ target: el, offset: ["start start", "end end"] });
  return { ref, p: scrollYProgress };
}
