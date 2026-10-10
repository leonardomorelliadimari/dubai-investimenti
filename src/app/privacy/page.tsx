import type { Metadata } from "next";
import { Footer } from "@/components/Footer";

// PLACEHOLDER_LEGAL: testo da redigere con un consulente legale prima della pubblicazione.
export const metadata: Metadata = { title: "Informativa privacy" };

export default function Page() {
  return (
    <>
      <main id="contenuto" className="bg-ivory px-5 pb-32 pt-36 md:px-10 md:pt-44">
        <div className="mx-auto max-w-2xl">
          <h1 className="display text-[clamp(2.5rem,6vw,4.5rem)]">Informativa privacy</h1>
          <div className="mt-10 space-y-5 text-lg leading-relaxed text-graphite">
          <p>Questa pagina conterrà l&apos;informativa sul trattamento dei dati personali ai sensi del Regolamento (UE) 2016/679 (GDPR).</p>
          <p>Titolare del trattamento, finalità, base giuridica, tempi di conservazione, diritti dell&apos;interessato e modalità di contatto verranno indicati qui prima della pubblicazione.</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
