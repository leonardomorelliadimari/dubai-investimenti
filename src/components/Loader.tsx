"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { site } from "@/data/site";

/** Breve intro (una volta per sessione). Non blocca il rendering: è solo un velo sopra la pagina. */
export function Loader() {
  const [show, setShow] = useState(true);
  const [skip, setSkip] = useState(false);
  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem("intro-seen") === "1"; sessionStorage.setItem("intro-seen", "1"); } catch {}
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (seen || reduced) { setSkip(true); return; }
    const t = setTimeout(() => setShow(false), 1500);
    return () => clearTimeout(t);
  }, []);

  if (skip) return null;
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="loader"
          aria-hidden
          className="fixed inset-0 z-[90] flex items-center justify-center bg-ivory"
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          initial={{ clipPath: "inset(0 0 0% 0)" }}
          transition={{ duration: 1.1, ease: [0.76, 0, 0.24, 1] }}
        >
          <div className="flex flex-col items-center gap-6">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="flex items-center gap-3">
              <LogoMark className="h-6 w-6 text-ink" />
              <span className="text-sm font-medium tracking-[-0.01em]">{site.brandName}</span>
            </motion.div>
            <div className="h-px w-40 overflow-hidden bg-ink/10">
              <motion.div className="h-full bg-bronze" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} style={{ originX: 0 }} transition={{ duration: 1.25, ease: [0.65, 0, 0.35, 1] }} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** PLACEHOLDER_LOGO: marchio geometrico provvisorio (meridiano + orizzonte). */
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M12 1.5v21" stroke="currentColor" strokeWidth="1.2" />
      <path d="M1.5 14.5h21" stroke="currentColor" strokeWidth="1.2" />
      <rect x="13.6" y="7" width="2.4" height="7.5" fill="currentColor" />
      <rect x="17" y="10" width="2" height="4.5" fill="currentColor" />
    </svg>
  );
}
