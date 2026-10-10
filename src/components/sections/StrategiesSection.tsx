import { Pop } from "../ui/Pop";
import { TiltCard } from "../ui/TiltCard";

const profiles = [
  { t: "Rendita", d: "Un immobile che genera affitto.", tone: "#2f8c8f", hint: "JVC · Business Bay" },
  { t: "Crescita", d: "Aree in sviluppo, capitale che si rivaluta.", tone: "#e9a87c", hint: "Creek Harbour · off-plan" },
  { t: "Diversificazione", d: "Una parte del patrimonio fuori dall'Italia.", tone: "#6f9bb0", hint: "Mix pronto + liquidità" },
  { t: "Premium", d: "Immobili unici negli indirizzi iconici.", tone: "#c4714d", hint: "Downtown · Palm" },
];

export function StrategiesSection() {
  return (
    <section id="strategie" className="relative z-10 bg-ivory-2 px-5 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-[1280px]">
        <Pop>
          <p className="eyebrow mb-5 text-terracotta">Strategie</p>
          <h2 className="display max-w-[16ch] text-[clamp(2.2rem,5.4vw,4.75rem)]">Non esiste un investimento giusto.</h2>
          <p className="mt-5 max-w-lg text-lg text-graphite">Esiste quello giusto per il tuo obiettivo.</p>
        </Pop>
        <div className="mt-12 grid gap-3 sm:grid-cols-2 md:mt-16 lg:grid-cols-4">
          {profiles.map((p, i) => (
            <Pop key={p.t} delay={i * 0.08}>
              <TiltCard className="h-full rounded-[26px]">
                <article className="relative flex h-full min-h-[260px] flex-col justify-between overflow-hidden rounded-[26px] border border-ink/[0.07] bg-white p-7 shadow-[0_30px_70px_-45px_rgb(11_14_18/0.5)]">
                  <div aria-hidden className="absolute -right-14 -top-14 h-44 w-44 rounded-full opacity-30 blur-2xl transition-opacity duration-700 group-hover:opacity-55" style={{ background: p.tone }} />
                  <div aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: p.tone }} />
                  <span className="tabular relative text-sm text-mist">0{i + 1}</span>
                  <div className="relative">
                    <h3 className="text-3xl font-medium tracking-[-0.045em]">{p.t}</h3>
                    <p className="mt-2 text-graphite">{p.d}</p>
                    <p className="mt-5 text-xs font-medium uppercase tracking-[0.14em]" style={{ color: p.tone }}>{p.hint}</p>
                  </div>
                </article>
              </TiltCard>
            </Pop>
          ))}
        </div>
      </div>
    </section>
  );
}
