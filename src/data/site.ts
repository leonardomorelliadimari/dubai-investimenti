/**
 * Configurazione generale del sito.
 * PLACEHOLDER: nome brand, contatti e segnali di fiducia vanno sostituiti con dati reali.
 * Nessuna licenza, recensione, partnership o numero di clienti è stato inventato:
 * gli array vuoti non vengono renderizzati finché non vengono compilati.
 */

export const site = {
  // PLACEHOLDER_BRAND: sostituire con il nome e il logo reali.
  brandName: "Meridiano 25",
  brandTagline: "Osservatorio sul mercato immobiliare di Dubai",
  url: "https://example.com", // PLACEHOLDER_URL
  contact: {
    email: "info@example.com", // PLACEHOLDER_CONTACT
    phone: "", // PLACEHOLDER_CONTACT
    address: "", // PLACEHOLDER_CONTACT
  },
};

export const navItems = [
  { id: "mercato", label: "Mercato" },
  { id: "perche-dubai", label: "Perché Dubai" },
  { id: "aree", label: "Aree" },
  { id: "strategie", label: "Strategie" },
  { id: "come-funziona", label: "Come funziona" },
] as const;

export type TrustItem = { label: string; detail: string; href?: string };

/**
 * Segnali di fiducia verificabili. Compilare SOLO con informazioni reali e documentabili.
 * Se un array è vuoto, il relativo blocco non viene mostrato.
 */
export const trust = {
  // es. { label: "RERA Broker Card", detail: "N. ..." }
  licenses: [] as TrustItem[],
  // es. { label: "Nome Cognome", detail: "Ruolo" }
  team: [] as TrustItem[],
  // es. { label: "Testata", detail: "Titolo articolo", href: "..." }
  press: [] as TrustItem[],
  partners: [] as TrustItem[],
};

/** Impegni editoriali: non sono dati, sono principi di metodo (modificabili). */
export const principles = [
  {
    title: "Nessun rendimento garantito",
    text: "Parliamo di stime, scenari e ipotesi. Mai di promesse.",
  },
  {
    title: "Dati con fonte",
    text: "Ogni numero di mercato che mostriamo indica da dove proviene.",
  },
  {
    title: "Prima l'obiettivo",
    text: "Nessuna proposta prima di aver capito capitale, orizzonte e aspettative.",
  },
  {
    title: "Costi spiegati",
    text: "Commissioni, spese di gestione e oneri accessori vengono esplicitati.",
  },
];
