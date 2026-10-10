import { MagneticButton } from "@/components/ui/MagneticButton";

export default function NotFound() {
  return (
    <main id="contenuto" className="flex min-h-[100svh] flex-col items-center justify-center bg-ivory px-5 text-center">
      <p className="eyebrow text-bronze">404</p>
      <h1 className="display mt-6 text-[clamp(2.5rem,6vw,5rem)]">Questa pagina non esiste.</h1>
      <div className="mt-10"><MagneticButton href="/" arrow>Torna alla guida</MagneticButton></div>
    </main>
  );
}
