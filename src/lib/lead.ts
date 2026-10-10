import { site } from "@/data/site";

/**
 * Invio delle richieste. Il sito è statico (GitHub Pages), quindi non ha un server:
 * - se è impostata NEXT_PUBLIC_FORM_ENDPOINT (es. un endpoint Formspree) i dati vengono inviati lì;
 * - altrimenti si apre il client email dell'utente con il riepilogo già compilato.
 */
export async function submitLead(payload: { type: string; answers?: Record<string, string | undefined>; contact: Record<string, string | boolean> }) {
  const endpoint = process.env.NEXT_PUBLIC_FORM_ENDPOINT;
  if (endpoint) {
    const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload) });
    if (!res.ok) throw new Error("submit_failed");
    return "sent" as const;
  }
  const lines = [
    ...Object.entries(payload.answers ?? {}).map(([k, v]) => `${k}: ${v ?? "-"}`),
    "",
    ...Object.entries(payload.contact).filter(([k]) => k !== "consent").map(([k, v]) => `${k}: ${v}`),
  ];
  const subject = payload.type === "questionnaire" ? "Profilo investitore – Dubai" : "Richiesta di contatto";
  window.location.href = `mailto:${site.contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
  return "mailto" as const;
}
