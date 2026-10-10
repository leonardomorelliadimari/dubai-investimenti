import type { Metadata } from "next";
import { InvestmentQuestionnaire } from "@/components/InvestmentQuestionnaire";

export const metadata: Metadata = {
  title: "Questionario investitore",
  description: "Cinque domande per capire quali opportunità immobiliari a Dubai sono compatibili con il tuo capitale e i tuoi obiettivi.",
};

export default function InvestimentiPage() {
  return (
    <main id="contenuto" className="relative min-h-[100svh] bg-ivory">
      <div className="arch-grid pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" aria-hidden />
      <InvestmentQuestionnaire />
    </main>
  );
}
