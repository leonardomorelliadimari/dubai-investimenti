"use client";
import { AnimatePresence, motion, useMotionValueEvent } from "framer-motion";
import { useCallback, useRef, useState } from "react";
import { areas, fmtRange, sqftAedToSqmEur } from "@/data/dubaiMarket";
import { useChapter } from "../world/useChapter";
import { mapFocus, pinEls } from "../world/store";
import { RangePop } from "../ui/Pop";
import { easePremium } from "@/lib/motion";
import { num } from "@/lib/format";

function Pin({ id, name, active, onSelect }: { id: string; name: string; active: boolean; onSelect: () => void }) {
  const ref = useCallback((el: HTMLButtonElement | null) => { if (el) pinEls.set(id, el); else pinEls.delete(id); }, [id]);
  return (
    <button
      ref={ref}
      onClick={onSelect}
      onMouseEnter={onSelect}
      className="group absolute left-0 top-0 -ml-3 -mt-3 flex items-center gap-2 opacity-0 transition-opacity duration-300"
      aria-label={name}
      aria-pressed={active}
    >
      <span className="relative flex h-6 w-6 items-center justify-center">
        <span className={`absolute inset-0 rounded-full ${active ? "bg-terracotta/40" : "bg-white/40"} animate-ping [animation-duration:2.4s]`} />
        <span className={`relative h-3.5 w-3.5 rounded-full border-2 border-white shadow-lg transition-transform duration-300 ${active ? "scale-125 bg-terracotta" : "bg-ink"}`} />
      </span>
      <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium shadow-lg transition-all duration-300 ${active ? "bg-ink text-white" : "bg-white/90 text-ink max-md:hidden"}`}>{name}</span>
    </button>
  );
}

export function MapChapter() {
  const { ref, p } = useChapter("map");
  const [auto, setAuto] = useState(0);
  const [manual, setManual] = useState<number | null>(null);
  const lastAuto = useRef(0);
  useMotionValueEvent(p, "change", (v) => {
    const i = Math.min(areas.length - 1, Math.max(0, Math.floor(((v - 0.12) / 0.8) * areas.length)));
    if (i !== lastAuto.current) { lastAuto.current = i; setAuto(i); setManual(null); }
  });
  const idx = manual ?? auto;
  const a = areas[idx];
  mapFocus.id = a.id;
  const price = Array.isArray(a.priceSqftAed) ? a.priceSqftAed.map(sqftAedToSqmEur) as [number, number] : sqftAedToSqmEur(a.priceSqftAed);

  return (
    <section id="aree" ref={ref} className="relative h-[260vh]" aria-label="Le aree di Dubai" data-theme="dark">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black/30 to-transparent" />
        <div className="absolute left-5 top-24 z-10 md:left-10 md:top-28">
          <RangePop p={p} at={0} from="left">
            <p className="eyebrow mb-3 text-white/90">Le aree</p>
            <h2 className="display max-w-[12ch] text-[clamp(2rem,4.4vw,4.25rem)] text-white [text-shadow:0_2px_30px_rgb(0_0_0/0.3)]">Una città, molti mercati.</h2>
          </RangePop>
        </div>

        <div className="absolute inset-0">
          {areas.map((ar, i) => <Pin key={ar.id} id={ar.id} name={ar.name} active={i === idx} onSelect={() => setManual(i)} />)}
        </div>

        <div className="absolute inset-x-4 bottom-5 z-10 md:inset-x-auto md:bottom-10 md:right-10 md:w-[400px]">
          <RangePop p={p} at={0.04}>
            <div className="grid">
              <AnimatePresence initial={false}>
                <motion.article
                  key={a.id}
                  className="rounded-[24px] border border-white/40 bg-white/85 p-6 shadow-[0_30px_80px_-30px_rgb(0_0_0/0.5)] [grid-area:1/1] md:bg-white/75 md:p-7 md:backdrop-blur-xl"
                  initial={{ opacity: 0, y: 24, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.98 }}
                  transition={{ duration: 0.5, ease: easePremium }}
                >
                  <div className="flex items-center justify-between">
                    <p className="eyebrow text-terracotta">{a.profile}</p>
                    <div className="flex gap-1">
                      {areas.map((_, k) => <button key={k} aria-label={areas[k].name} onClick={() => setManual(k)} className={`h-1.5 rounded-full transition-all ${k === idx ? "w-5 bg-ink" : "w-1.5 bg-ink/20"}`} />)}
                    </div>
                  </div>
                  <h3 className="mt-3 text-[1.75rem] font-medium leading-tight tracking-[-0.04em] md:text-3xl">{a.name}</h3>
                  <p className="mt-2 text-graphite">{a.summary} <span className="text-ink/70">{a.types}.</span></p>
                  <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-ink/10 pt-5">
                    <div>
                      <dt className="eyebrow text-[0.625rem] text-mist">Prezzo medio</dt>
                      <dd className="tabular mt-1 text-xl font-medium tracking-[-0.02em]">≈ €{fmtRange(price, (n) => num(Math.round(n / 50) * 50))}/m²</dd>
                      <dd className="tabular text-xs text-mist">AED {fmtRange(a.priceSqftAed, (n) => num(n))}/ft²</dd>
                    </div>
                    <div>
                      <dt className="eyebrow text-[0.625rem] text-mist">Rendimento lordo</dt>
                      <dd className="tabular mt-1 text-xl font-medium tracking-[-0.02em]">{fmtRange(a.grossYield, (n) => num(n, 1))}%</dd>
                      <dd className="text-xs text-mist">prima di spese e sfitto</dd>
                    </div>
                  </dl>
                  <a href={a.source.url} target="_blank" rel="noopener noreferrer" className="link-underline mt-4 inline-block text-[0.625rem] uppercase tracking-[0.12em] text-mist">Fonte: {a.source.name}, {a.source.date}</a>
                </motion.article>
              </AnimatePresence>
            </div>
          </RangePop>
        </div>
      </div>
    </section>
  );
}
