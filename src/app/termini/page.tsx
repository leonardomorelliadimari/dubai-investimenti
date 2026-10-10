import type { Metadata } from "next";
import { Footer } from "@/components/Footer";

// PLACEHOLDER_LEGAL: testo da redigere con un consulente legale prima della pubblicazione.
export const metadata: Metadata = { title: "Termini di utilizzo" };

export default function Page() {
  return (
    <>
      <main id="contenuto" className="bg-ivory px-5 pb-32 pt-36 md:px-10 md:pt-44">
        <div className="mx-auto max-w-2xl">
          <h1 className="display text-[clamp(2.5rem,6vw,4.5rem)]">Termini di utilizzo</h1>
          <div className="mt-10 space-y-5 text-lg leading-relaxed text-graphite">
          <p>I contenuti presenti su questo sito hanno finalità esclusivamente informative e non costituiscono consulenza finanziaria, fiscale o legale.</p>
          <p>Ogni investimento comporta rischi e deve essere valutato in relazione alla propria situazione personale. I termini completi verranno pubblicati qui.</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
