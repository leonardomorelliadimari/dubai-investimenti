"use client";
import { motion, useTransform } from "framer-motion";
import { useChapter } from "../world/useChapter";
import { RangePop } from "../ui/Pop";
import { MagneticButton } from "../ui/MagneticButton";
import { useScrollTo } from "../SmoothScroll";
import { easePremium } from "@/lib/motion";

const questions = ["Una casa in più?", "Liquidità ferma sul conto?", "Capitale da diversificare?"];

export function IntroChapter() {
  const { ref, p } = useChapter("intro");
  const scrollTo = useScrollTo();
  const heroOpacity = useTransform(p, [0, 0.22, 0.3], [1, 1, 0]);
  const heroY = useTransform(p, [0, 0.3], [0, -80]);
  const cue = useTransform(p, [0, 0.05], [1, 0]);

  return (
    <section ref={ref} className="relative h-[290vh]" aria-label="Introduzione" data-theme="dark">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* velo per la leggibilità */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/30 to-transparent" />

        {/* HERO */}
        <motion.div style={{ opacity: heroOpacity, y: heroY }} className="absolute inset-0 mx-auto flex max-w-[1680px] flex-col justify-end px-5 pb-20 md:px-10 md:pb-24">
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.3, ease: easePremium }} className="eyebrow mb-5 text-white/85">
            Mercato immobiliare · Dubai
          </motion.p>
          <h1 className="display max-w-[15ch] text-[clamp(2.7rem,7.6vw,8rem)] text-white [text-shadow:0_2px_40px_rgb(0_0_0/0.25)]">
            {["Il tuo prossimo", "investimento potrebbe", "non essere in Italia."].map((l, i) => (
              <span key={l} className="block overflow-hidden pb-[0.06em]">
                <motion.span className="block" initial={{ y: "105%" }} animate={{ y: 0 }} transition={{ duration: 1.1, delay: 0.35 + i * 0.1, ease: easePremium }}>
                  {l}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.85, ease: easePremium }} className="mt-8 flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <p className="max-w-md text-lg leading-snug text-white/90 md:text-xl">
              Perché sempre più investitori guardano a Dubai. Opportunità e rischi, senza promesse.
            </p>
            <div className="flex flex-wrap gap-3">
              <MagneticButton href="#perche-dubai" onClick={() => scrollTo("perche-dubai")} variant="light" arrow>Scopri perché</MagneticButton>
              <MagneticButton href="#aree" onClick={() => scrollTo("aree")} variant="ghost-light">Esplora il mercato</MagneticButton>
            </div>
          </motion.div>
        </motion.div>

        {/* domande */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-5 md:gap-4">
          {questions.map((q, i) => (
            <RangePop key={q} p={p} at={0.32 + i * 0.07} out={0.66}>
              <p className="rounded-full bg-white/85 px-6 py-3 text-center text-[clamp(1.25rem,3vw,2.25rem)] font-medium tracking-[-0.03em] text-ink shadow-[0_20px_60px_-20px_rgb(0_0_0/0.4)] md:px-9 md:py-4">
                {q}
              </p>
            </RangePop>
          ))}
        </div>
        <div className="absolute inset-0 flex items-center justify-center px-5">
          <RangePop p={p} at={0.7}>
            <p className="eyebrow mb-4 text-center text-white/85">Prima o poi arriva la domanda</p>
            <h2 className="display max-w-[12ch] text-center text-[clamp(2.8rem,9vw,9rem)] text-white [text-shadow:0_4px_60px_rgb(0_0_0/0.3)]">
              Dove ha più senso investire?
            </h2>
          </RangePop>
        </div>

        <motion.div style={{ opacity: cue }} className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-white/80 md:flex" aria-hidden>
          <span className="eyebrow text-[0.625rem]">Scroll</span>
          <span className="relative h-9 w-px overflow-hidden bg-white/30">
            <motion.span className="absolute inset-x-0 top-0 h-1/2 bg-white" animate={{ y: ["-100%", "200%"] }} transition={{ duration: 2, repeat: Infinity, ease: [0.65, 0, 0.35, 1] }} />
          </span>
        </motion.div>
      </div>
    </section>
  );
}
