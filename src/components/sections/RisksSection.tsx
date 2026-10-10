import { Pop } from "../ui/Pop";

const risks = [
  ["Developer sbagliato", "Storico delle consegne e solidità finanziaria."],
  ["Quartiere sbagliato", "Domanda reale e offerta futura dell'area."],
  ["Prezzo troppo alto", "Il prezzo d'ingresso decide ogni rendimento."],
  ["Troppa offerta", "40.000 nuove unità all'anno pesano su affitti e prezzi."],
  ["Cambio €/AED", "Il dirham segue il dollaro: il cambio incide sul risultato."],
  ["Ciclo di mercato", "Dubai ha fasi di crescita e di correzione."],
  ["Liquidità", "Vendere presto, e al prezzo giusto, non è garantito."],
  ["Tasse in Italia", "Da residente italiano, redditi e patrimonio esteri si dichiarano."],
];

export function RisksSection() {
  return (
    <section id="rischi" data-theme="dark" className="relative z-10 overflow-hidden bg-night px-5 py-24 text-ivory md:px-10 md:py-32">
      <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 h-[60vmax] w-[60vmax] rounded-full bg-[radial-gradient(circle,rgb(196_113_77/0.22),transparent_60%)]" />
      <div className="relative mx-auto max-w-[1280px]">
        <Pop>
          <p className="eyebrow mb-5 text-apricot">Rischi</p>
          <h2 className="display max-w-[14ch] text-[clamp(2.2rem,6vw,5.5rem)]">E no, non è senza rischi.</h2>
        </Pop>
        <ol className="mt-12 grid gap-3 sm:grid-cols-2 md:mt-16 lg:grid-cols-4">
          {risks.map(([t, d], i) => (
            <Pop as="li" key={t} delay={(i % 4) * 0.07} className="rounded-[22px] border border-white/10 bg-white/[0.04] p-6 transition-colors duration-500 hover:bg-white/[0.08]">
              <span className="tabular text-xs text-apricot">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-6 text-xl font-medium tracking-[-0.025em]">{t}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-white/55">{d}</p>
            </Pop>
          ))}
        </ol>
        <Pop className="mt-16 md:mt-24">
          <p className="display max-w-[20ch] text-[clamp(1.9rem,4.6vw,4rem)]">Per questo non basta scegliere <span className="text-apricot">un appartamento bello.</span></p>
        </Pop>
      </div>
    </section>
  );
}
