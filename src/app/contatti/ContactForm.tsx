"use client";
import Link from "next/link";
import { useState } from "react";
import { Field } from "@/components/InvestmentQuestionnaire";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { submitLead } from "@/lib/lead";

export function ContactForm() {
  const [v, setV] = useState({ name: "", email: "", phone: "", message: "", consent: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (v.name.trim().length < 2) er.name = "Inserisci il tuo nome.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) er.email = "Inserisci un indirizzo email valido.";
    if (!v.consent) er.consent = "Serve il consenso per poterti ricontattare.";
    setErrors(er);
    if (Object.keys(er).length) return;
    setState("sending");
    try {
      await submitLead({ type: "contact", contact: v });
      setState("done");
    } catch {
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <div role="status" className="rounded-[24px] border border-ink/10 bg-white/60 p-8">
        <p className="text-2xl font-medium tracking-[-0.03em]">Messaggio ricevuto.</p>
        <p className="mt-3 text-graphite">Ti risponderemo il prima possibile.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-3">
      <Field label="Nome" name="name" autoComplete="name" value={v.name} error={errors.name} onChange={(x) => setV((s) => ({ ...s, name: x }))} />
      <Field label="Email" name="email" type="email" autoComplete="email" value={v.email} error={errors.email} onChange={(x) => setV((s) => ({ ...s, email: x }))} />
      <Field label="Telefono (facoltativo)" name="phone" type="tel" autoComplete="tel" value={v.phone} onChange={(x) => setV((s) => ({ ...s, phone: x }))} />
      <div className="rounded-2xl border border-ink/10 bg-white/60 transition-colors focus-within:border-ink">
        <label htmlFor="f-message" className="sr-only">Messaggio</label>
        <textarea id="f-message" rows={5} placeholder="Di cosa vorresti parlare?" value={v.message} onChange={(e) => setV((s) => ({ ...s, message: e.target.value }))} className="w-full resize-none rounded-2xl bg-transparent px-5 py-4 text-lg outline-none placeholder:text-graphite" />
      </div>
      <label className="flex cursor-pointer items-start gap-3 pt-3 text-sm leading-relaxed text-graphite">
        <input type="checkbox" checked={v.consent} onChange={(e) => setV((s) => ({ ...s, consent: e.target.checked }))} className="mt-1 h-4 w-4 shrink-0 accent-[#0b0e12]" aria-invalid={!!errors.consent} />
        <span>Acconsento al trattamento dei dati come descritto nell&apos;<Link href="/privacy" className="underline underline-offset-2">informativa privacy</Link>.</span>
      </label>
      {errors.consent && <p className="text-sm text-[#9a3b2e]">{errors.consent}</p>}
      <div className="pt-6"><MagneticButton type="submit" arrow disabled={state === "sending"}>{state === "sending" ? "Invio in corso…" : "Invia"}</MagneticButton></div>
      {state === "error" && <p role="alert" className="text-sm text-[#9a3b2e]">Invio non riuscito. Riprova tra qualche istante.</p>}
    </form>
  );
}
