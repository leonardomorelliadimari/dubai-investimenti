"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { comparisonFactors, type Lean } from "@/data/dubaiMarket";
import { Pop } from "../ui/Pop";
import { easePremium } from "@/lib/motion";

const lean: Record<Lean, { label: string; cls: string }> = {
  strength: { label: "Punto di forza", cls: "bg-gulf" },
  consider: { label: "Da valutare", cls: "border border-ink/40" },
  neutral: { label: "Dipende", cls: "bg-ink/25" },
};

export function ComparisonSection() {
  const [i, setI] = useState(0);
  const f = comparisonFactors[i];
  return (
    <section id="mercato" className="relative z-10 bg-ivory px-5 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-[1280px]">
        <Pop>
          <p className="eyebrow mb-5 text-terracotta">Italia o Dubai?</p>
          <h2 className="display max-w-[16ch] text-[clamp(2.2rem,5.4vw,4.75rem)]">Vicino non vuol dire migliore.</h2>
          <p className="mt-5 max-w-lg text-lg text-graphite">Nessuno dei due vince su tutto. Conta il tuo obiettivo.</p>
        </Pop>

        <Pop delay={0.1} className="mt-12 overflow-hidden rounded-[28px] border border-ink/[0.08] bg-white/70 md:mt-16">
          <div role="tablist" aria-label="Fattori di confronto" className="no-scrollbar flex gap-1 overflow-x-auto border-b border-ink/[0.08] p-2 md:justify-center">
            {comparisonFactors.map((c, k) => (
              <button key={c.id} role="tab" aria-selected={k === i} onClick={() => setI(k)} className="relative shrink-0 rounded-full px-5 py-2.5 text-sm text-graphite transition-colors hover:text-ink aria-selected:text-ivory">
                {k === i && <motion.span layoutId="cmp-pill" className="absolute inset-0 rounded-full bg-ink" transition={{ duration: 0.5, ease: easePremium }} />}
                <span className="relative">{c.label}</span>
              </button>
            ))}
          </div>
          <div className="grid md:grid-cols-2">
            {(["italy", "dubai"] as const).map((side) => (
              <div key={side} className={`relative min-h-[220px] p-7 md:min-h-[260px] md:p-12 ${side === "dubai" ? "border-t border-ink/[0.08] bg-[linear-gradient(150deg,#dbe8ee_0%,#f3e3cf_60%,#f0c9a6_100%)] md:border-l md:border-t-0" : ""}`}>
                <h3 className={`text-3xl font-medium tracking-[-0.04em] md:text-4xl ${side === "dubai" ? "text-terracotta" : ""}`}>{side === "italy" ? "Italia" : "Dubai"}</h3>
                <div className="grid">
                  <AnimatePresence initial={false}>
                    <motion.div key={f.id + side} className="mt-8 [grid-area:1/1]" initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.45, ease: easePremium }}>
                      <p className="max-w-md text-xl leading-snug tracking-[-0.015em] md:text-2xl">{f[side].text}</p>
                      <span className="mt-6 inline-flex items-center gap-2 text-xs text-graphite"><span className={`h-2 w-2 rounded-full ${lean[f[side].lean].cls}`} />{lean[f[side].lean].label}</span>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        </Pop>
      </div>
    </section>
  );
}
