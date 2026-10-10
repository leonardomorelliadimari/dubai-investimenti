"use client";
import { useChapter } from "../world/useChapter";
import { RangePop } from "../ui/Pop";
import { MagneticButton } from "../ui/MagneticButton";

export function NightChapter() {
  const { ref, p } = useChapter("night");
  return (
    <section ref={ref} data-theme="dark" className="relative h-[230vh] text-white" aria-label="Scopri gli investimenti">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgb(0_0_0/0.35),transparent_70%)]" />
        <div className="relative mx-auto flex h-full max-w-[1280px] flex-col items-center justify-center px-5 text-center">
          <RangePop p={p} at={0.08}>
            <h2 className="display text-balance text-[clamp(2.2rem,6vw,5.75rem)] text-white/70">Non devi comprare casa a Dubai.</h2>
          </RangePop>
          <RangePop p={p} at={0.3}>
            <p className="display mt-2 text-balance text-[clamp(2.2rem,6vw,5.75rem)] text-apricot">Devi capire se ha senso per te.</p>
          </RangePop>
          <RangePop p={p} at={0.5}>
            <p className="mx-auto mt-10 max-w-md text-lg text-white/75">Cinque domande. Due minuti. Ti mostriamo le opportunità compatibili con te.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <MagneticButton href="/investimenti" variant="light" arrow strength={0.35}>Scopri gli investimenti</MagneticButton>
              <MagneticButton href="/contatti" variant="ghost-light">Parla con noi</MagneticButton>
            </div>
          </RangePop>
        </div>
      </div>
    </section>
  );
}
