"use client";
import { motion } from "framer-motion";
import { AED_PER_EUR, aedToEur, computeExample, exampleInvestment as ex } from "@/data/dubaiMarket";
import { eur, pct } from "@/lib/format";
import { Pop } from "../ui/Pop";
import { RiskBadge } from "../ui/RiskBadge";

const steps = ["Capitale", "Obiettivo", "Orizzonte", "Area", "Tipologia", "Developer", "Prezzo", "Affitto", "Rischi", "Uscita"];

export function MethodSection() {
  const c = computeExample();
  const e = (aed: number) => eur(Math.round(aedToEur(aed) / 100) * 100);
  const max = ex.annualRentAed;
  const bars = [
    { l: "Affitto lordo", v: ex.annualRentAed, from: 0, k: "in" },
    { l: "Service charges", v: -ex.serviceChargesAed, from: ex.annualRentAed - ex.serviceChargesAed, k: "out" },
    { l: "Gestione e sfitto", v: -ex.managementAed, from: c.netAed, k: "out" },
    { l: "Netto", v: c.netAed, from: 0, k: "net" },
  ];

  return (
    <section id="come-funziona" className="relative z-10 bg-ivory px-5 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-[1280px]">
        <Pop>
          <p className="eyebrow mb-5 text-terracotta">Il metodo</p>
          <h2 className="display text-[clamp(2.2rem,5.4vw,4.75rem)]">Prima l&apos;investimento.<br /><span className="text-graphite">Poi l&apos;immobile.</span></h2>
        </Pop>

        {/* motore decisionale */}
        <div className="mt-12 flex flex-wrap items-center gap-2 md:mt-16">
          {steps.map((s, i) => (
            <motion.div
              key={s}
              className="flex items-center gap-2"
              initial={{ opacity: 0, scale: 0.6, y: 10 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -10% 0px" }}
              transition={{ delay: i * 0.08, duration: 0.5, ease: [0.2, 1.4, 0.4, 1] }}
            >
              <span className="rounded-full border border-ink/12 bg-white px-4 py-2 text-sm font-medium shadow-sm"><span className="tabular mr-2 text-mist">{String(i + 1).padStart(2, "0")}</span>{s}</span>
              <span aria-hidden className="text-mist">→</span>
            </motion.div>
          ))}
          <motion.span
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-ivory"
            initial={{ opacity: 0, scale: 0.6 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: steps.length * 0.08 + 0.1, duration: 0.6, ease: [0.2, 1.4, 0.4, 1] }}
          >
            Opportunità compatibili
          </motion.span>
        </div>

        {/* esempio */}
        <div className="mt-20 grid gap-4 lg:grid-cols-[1fr_1.15fr]">
          <Pop className="relative overflow-hidden rounded-[28px] border border-ink/[0.07] bg-white p-7 shadow-[0_40px_90px_-50px_rgb(11_14_18/0.45)] md:p-9">
            <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgb(233_168_124/0.35),transparent_65%)]" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow text-mist">Un esempio</p>
                <h3 className="mt-2 text-4xl font-medium tracking-[-0.045em]">{ex.area}</h3>
                <p className="mt-1 text-graphite">{ex.type}</p>
              </div>
              <span className="shrink-0 rounded-full bg-ink px-3 py-1.5 text-[0.625rem] font-medium uppercase tracking-[0.14em] text-ivory">Illustrativo</span>
            </div>
            <dl className="relative mt-8 grid grid-cols-2 gap-x-6 gap-y-5">
              {[
                ["Prezzo", e(ex.priceAed), `AED ${ex.priceAed.toLocaleString("it-IT")}`],
                ["Affitto stimato", `${e(ex.annualRentAed)}/anno`, ""],
                ["Rendimento lordo", pct(c.grossYield), ""],
                ["Rendimento netto", pct(c.netYield), "dopo spese stimate"],
                ["Tassa DLD (4%)", e(c.dldAed), "una tantum all'acquisto"],
                ["Orizzonte", `${ex.holdingYears} anni`, ""],
              ].map(([l, v, h]) => (
                <div key={l} className="border-t border-ink/[0.08] pt-3">
                  <dt className="eyebrow text-[0.625rem] text-mist">{l}</dt>
                  <dd className="tabular mt-1 text-xl font-medium tracking-[-0.025em] md:text-2xl">{v}</dd>
                  {h && <dd className="text-xs text-mist">{h}</dd>}
                </div>
              ))}
            </dl>
            <div className="relative mt-6"><RiskBadge level={ex.riskProfile} /></div>
          </Pop>

          <Pop delay={0.1} className="flex flex-col rounded-[28px] border border-ink/[0.07] bg-white/60 p-7 md:p-9">
            <p className="eyebrow text-mist">Cashflow annuo stimato</p>
            <div className="mt-8 grid flex-1 grid-cols-4 items-end gap-3 md:gap-5">
              {bars.map((b, i) => {
                const h = (Math.abs(b.v) / max) * 100, bottom = (b.from / max) * 100;
                return (
                  <div key={b.l} className="flex h-full min-h-[200px] flex-col">
                    <div className="relative flex-1">
                      <motion.div
                        className={`absolute inset-x-0 rounded-[6px] ${b.k === "in" ? "bg-ink/85" : b.k === "out" ? "border border-dashed border-terracotta/60 bg-terracotta/10" : "bg-gradient-to-t from-gulf to-[#5fb3b0]"}`}
                        style={{ bottom: `${bottom}%`, height: `${h}%`, originY: 1 }}
                        initial={{ scaleY: 0 }}
                        whileInView={{ scaleY: 1 }}
                        viewport={{ once: true, margin: "0px 0px -15% 0px" }}
                        transition={{ duration: 0.9, delay: 0.2 + i * 0.2, ease: [0.2, 1.2, 0.4, 1] }}
                      />
                      <p className="tabular absolute inset-x-0 text-center text-xs font-medium md:text-sm" style={{ bottom: `calc(${bottom + h}% + 6px)` }}>{b.v < 0 ? "−" : ""}{e(Math.abs(b.v))}</p>
                    </div>
                    <p className="mt-2 border-t border-ink/10 pt-2 text-[0.6875rem] leading-tight text-graphite md:text-xs">{b.l}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-8 border-t border-ink/[0.08] pt-5">
              <p className="eyebrow text-[0.625rem] text-mist">Rivendita dopo {ex.holdingYears} anni · scenari ipotetici</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {ex.resaleScenarios.map((s) => (
                  <div key={s.label} className={`rounded-xl p-3 ${s.change < 0 ? "bg-terracotta/10" : s.change > 0 ? "bg-gulf/10" : "bg-ink/[0.04]"}`}>
                    <p className="text-xs text-graphite">{s.label}</p>
                    <p className="tabular mt-1 text-sm font-medium md:text-base">{e(ex.priceAed * (1 + s.change))}</p>
                    <p className="tabular text-xs text-mist">{s.change > 0 ? "+" : s.change < 0 ? "−" : "±"}{Math.abs(s.change * 100)}%</p>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-5 text-[0.6875rem] leading-relaxed text-mist">
              Prezzo e rendimento: medie 2025 per Dubai Hills ({ex.sources.map((s, i) => <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{s.name}{i < ex.sources.length - 1 ? ", " : ""}</a>)}). Spese stimate. Cambio 1 € = {AED_PER_EUR} AED. Non è un&apos;offerta e la rivalutazione non è garantita.
            </p>
          </Pop>
        </div>
      </div>
    </section>
  );
}
