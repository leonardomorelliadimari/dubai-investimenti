"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { currentChapter, measureChapters, worldInfo } from "./store";
import type { Tier } from "./WorldScene";

const WorldScene = dynamic(() => import("./WorldScene"), { ssr: false });

function detectTier(): Tier | "none" {
  // ?q=low|mid|high forza la qualità (utile per test e confronti)
  const forced = new URLSearchParams(window.location.search).get("q");
  if (forced === "low" || forced === "mid" || forced === "high") return forced;
  try {
    const c = document.createElement("canvas");
    if (!(c.getContext("webgl2") || c.getContext("webgl"))) return "none";
  } catch { return "none"; }
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const cores = nav.hardwareConcurrency ?? 4;
  const mem = nav.deviceMemory ?? 4;
  const mobile = window.matchMedia("(max-width: 900px), (pointer: coarse)").matches;
  if (nav.connection?.saveData) return "low";
  if (mobile) return cores >= 8 && mem >= 6 ? "mid" : "low";
  if (cores >= 8 && mem >= 8) return "high";
  return cores >= 4 ? "mid" : "low";
}

/** Sfondo 3D fisso condiviso da tutta la pagina. Si accende solo quando un capitolo 3D è visibile. */
export function World() {
  const [tier, setTier] = useState<Tier | "none" | null>(null);
  const [active, setActive] = useState(true);
  const [ready, setReady] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setTier(detectTier());
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const onReady = () => setReady(true);
    worldInfo.listeners.add(onReady);
    if (worldInfo.ready) setReady(true);

    let raf = 0;
    const check = () => {
      raf = 0;
      setActive(!!currentChapter());
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(check); };
    const ro = new ResizeObserver(() => { measureChapters(); onScroll(); });
    ro.observe(document.body);
    window.addEventListener("scroll", onScroll, { passive: true });
    measureChapters();
    check();
    return () => {
      worldInfo.listeners.delete(onReady);
      window.removeEventListener("scroll", onScroll);
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0" style={{ visibility: active ? "visible" : "hidden" }}>
      {/* cielo di riserva mentre il 3D carica (o se WebGL non c'è) */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#5d8fb5_0%,#9fbdd0_34%,#f2cba0_62%,#f0a271_80%,#c98a62_100%)]" />
      {tier && tier !== "none" && (
        <div className="absolute inset-0 transition-opacity duration-[1400ms] ease-out" style={{ opacity: ready ? 1 : 0 }}>
          <WorldScene tier={tier} reduced={reduced} active={active} />
        </div>
      )}
    </div>
  );
}
