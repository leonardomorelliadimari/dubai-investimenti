"use client";
import { motion, useMotionValueEvent, useTransform } from "framer-motion";
import { useState } from "react";
import { useChapter } from "../world/useChapter";
import { RangePop } from "../ui/Pop";

const phases = [
  { t: "Lancio", d: "Compri su progetto: planimetrie, render, capitolato. Il developer conta più dell'immobile." },
  { t: "Struttura", d: "Paghi a rate durante la costruzione, secondo un payment plan." },
  { t: "Facciata", d: "I versamenti vanno di norma su conti vincolati al progetto (escrow). Da verificare sempre." },
  { t: "Consegna", d: "All'handover saldi, ricevi le chiavi: abiti, affitti o rivendi." },
];

export function BuildChapter() {
  const { ref, p } = useChapter("build");
  const [ph, setPh] = useState(0);
  useMotionValueEvent(p, "change", (v) => setPh(v < 0.28 ? 0 : v < 0.5 ? 1 : v < 0.74 ? 2 : 3));
  const bar = useTransform(p, [0.05, 0.95], [0, 1]);

  return (
    <section id="off-plan" ref={ref} className="relative h-[330vh]" aria-label="Off-plan" data-theme="dark">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-white/50 to-transparent" />
        <div className="absolute left-5 top-24 max-w-[min(520px,90vw)] md:left-10 md:top-28">
          <RangePop p={p} at={0} from="left">
            <p className="eyebrow mb-3 text-terracotta">Off-plan</p>
            <h2 className="display text-[clamp(2rem,4.4vw,4.25rem)] text-ink">E se l&apos;immobile non fosse ancora costruito?</h2>
          </RangePop>
        </div>

        <div className="absolute inset-x-4 bottom-5 md:inset-x-auto md:bottom-10 md:right-10 md:w-[420px]">
          <RangePop p={p} at={0.06}>
            <div className="rounded-[24px] border border-white/50 bg-white/85 p-6 shadow-[0_30px_80px_-30px_rgb(0_0_0/0.45)] md:bg-white/75 md:p-7 md:backdrop-blur-xl">
              <ol className="flex gap-1.5" aria-label="Fasi">
                {phases.map((x, i) => (
                  <li key={x.t} className="flex-1">
                    <div className={`h-1 rounded-full transition-colors duration-500 ${i <= ph ? "bg-terracotta" : "bg-ink/10"}`} />
                    <p className={`mt-2 text-[0.625rem] uppercase tracking-[0.14em] ${i === ph ? "text-ink" : "text-mist"}`}>{x.t}</p>
                  </li>
                ))}
              </ol>
              <motion.div key={ph} initial={{ opacity: 0, y: 14, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.45, ease: [0.2, 1.3, 0.4, 1] }} className="mt-5" aria-live="polite">
                <h3 className="text-2xl font-medium tracking-[-0.035em]">{String(ph + 1).padStart(2, "0")} · {phases[ph].t}</h3>
                <p className="mt-2 leading-snug text-graphite">{phases[ph].d}</p>
              </motion.div>
              <div className="mt-6 grid grid-cols-2 gap-4 border-t border-ink/10 pt-5 text-sm">
                <div>
                  <p className="eyebrow mb-2 text-[0.625rem] text-gulf">Vantaggi</p>
                  <p className="text-graphite">Pagamento dilazionato. Prezzo d&apos;ingresso. Immobile nuovo.</p>
                </div>
                <div>
                  <p className="eyebrow mb-2 text-[0.625rem] text-terracotta">Rischi</p>
                  <p className="text-graphite">Ritardi. Developer fragile. Mercato diverso alla consegna.</p>
                </div>
              </div>
              <div className="mt-5 h-px bg-ink/10"><motion.div style={{ scaleX: bar }} className="h-full origin-left bg-ink" /></div>
            </div>
          </RangePop>
        </div>
      </div>
    </section>
  );
}
