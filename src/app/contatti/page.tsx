import type { Metadata } from "next";
import { ContactForm } from "./ContactForm";
import { Footer } from "@/components/Footer";
import { MagneticButton } from "@/components/ui/MagneticButton";

export const metadata: Metadata = { title: "Parla con noi", description: "Una conversazione per capire se il mercato immobiliare di Dubai ha senso per te." };

export default function ContattiPage() {
  return (
    <>
      <main id="contenuto" className="bg-ivory px-5 pb-32 pt-36 md:px-10 md:pt-44">
        <div className="mx-auto grid max-w-[1680px] gap-16 lg:grid-cols-2">
          <div>
            <p className="eyebrow mb-6 text-bronze">Contatti</p>
            <h1 className="display text-[clamp(2.75rem,7vw,6rem)]">Parla con noi.</h1>
            <p className="mt-8 max-w-md text-lg leading-relaxed text-graphite">Una prima conversazione serve a capire se, e come, Dubai può avere un ruolo nel tuo patrimonio. Anche se la risposta è no.</p>
            <div className="mt-10 border-t border-ink/10 pt-8">
              <p className="text-sm text-graphite">Preferisci partire dal tuo profilo?</p>
              <div className="mt-4"><MagneticButton href="/investimenti" variant="secondary" arrow>Compila il questionario</MagneticButton></div>
            </div>
          </div>
          <ContactForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
