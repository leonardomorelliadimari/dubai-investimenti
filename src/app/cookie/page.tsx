import type { Metadata } from "next";
import { Footer } from "@/components/Footer";

// PLACEHOLDER_LEGAL: testo da redigere con un consulente legale prima della pubblicazione.
export const metadata: Metadata = { title: "Cookie policy" };

export default function Page() {
  return (
    <>
      <main id="contenuto" className="bg-ivory px-5 pb-32 pt-36 md:px-10 md:pt-44">
        <div className="mx-auto max-w-2xl">
          <h1 className="display text-[clamp(2.5rem,6vw,4.5rem)]">Cookie policy</h1>
          <div className="mt-10 space-y-5 text-lg leading-relaxed text-graphite">
          <p>Questa pagina descriverà i cookie e le tecnologie simili utilizzate dal sito.</p>
          <p>Allo stato attuale il sito non utilizza cookie di profilazione. Se verranno introdotti strumenti di analisi o marketing, sarà necessario un banner di consenso conforme.</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
