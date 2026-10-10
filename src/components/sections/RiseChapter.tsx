"use client";
import { keyFacts } from "@/data/dubaiMarket";
import { useChapter } from "../world/useChapter";
import { RangePop } from "../ui/Pop";
import { ProgressNumber } from "../ui/ProgressNumber";

export function RiseChapter() {
  const { ref, p } = useChapter("rise");
  const step = 0.165;
  return (
    <section id="perche-dubai" ref={ref} className="relative h-[400vh]" aria-label="Perché proprio Dubai" data-theme="dark">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div className="absolute left-5 top-24 md:left-10 md:top-28">
          <RangePop p={p} at={0.0} from="left">
            <p className="eyebrow mb-3 text-white/85">Perché proprio Dubai?</p>
            <h2 className="display max-w-[11ch] text-[clamp(2rem,4.4vw,4.25rem)] text-white [text-shadow:0_2px_30px_rgb(0_0_0/0.25)]">Cinque numeri, salendo.</h2>
          </RangePop>
        </div>

        {keyFacts.map((f, i) => {
          const at = 0.1 + i * step;
          const right = i % 2 === 0;
          return (
            <div key={f.n} className={`absolute inset-x-4 bottom-6 md:inset-x-auto md:bottom-auto md:top-[58%] md:w-[min(420px,34vw)] md:-translate-y-1/2 ${right ? "md:right-10" : "md:left-10"}`}>
              <RangePop p={p} at={at} out={i === keyFacts.length - 1 ? undefined : at + step} from={right ? "right" : "left"}>
                <article className="rounded-[26px] border border-white/40 bg-white/90 p-6 shadow-[0_30px_80px_-30px_rgb(0_0_0/0.45)] md:p-8">
                  <div className="flex items-center justify-between">
                    <span className="eyebrow text-terracotta">{f.n} · {f.title}</span>
                    <span className="eyebrow text-mist">{f.n}/05</span>
                  </div>
                  <ProgressNumber p={p} at={at} value={f.value} decimals={f.decimals} prefix={f.prefix} suffix={f.suffix} className="mt-4 block text-[clamp(3rem,6vw,5.25rem)] font-medium leading-none tracking-[-0.055em] text-ink" />
                  <p className="mt-2 text-sm font-medium text-ink/80">{f.caption}</p>
                  <p className="mt-4 text-pretty leading-snug text-graphite">{f.text}</p>
                  <a href={f.source.url} target="_blank" rel="noopener noreferrer" className="link-underline mt-5 inline-block text-[0.6875rem] uppercase tracking-[0.12em] text-mist">
                    Fonte: {f.source.name}, {f.source.date}
                  </a>
                </article>
              </RangePop>
            </div>
          );
        })}
      </div>
    </section>
  );
}
