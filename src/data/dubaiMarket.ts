/**
 * ─────────────────────────────────────────────────────────────────────────────
 * FILE CENTRALE DEI DATI DI MERCATO — aggiornato a ottobre 2026
 * ─────────────────────────────────────────────────────────────────────────────
 * Ogni dato riporta la fonte. Quando le fonti divergono è indicato un intervallo
 * o la fonte specifica usata. Prima di ogni aggiornamento del sito, ricontrollare
 * i valori (il mercato cambia rapidamente).
 */

export type Source = { name: string; url: string; date: string };

/** Cambio usato per le conversioni (metà mercato, 8 ottobre 2026). */
export const AED_PER_EUR = 4.11;
export const FX_SOURCE: Source = { name: "exchange-rates.org", url: "https://www.exchange-rates.org/exchange-rate-history/aed-eur-2026-10-01", date: "ott 2026" };
export const aedToEur = (aed: number) => aed / AED_PER_EUR;
/** AED per piede quadro → € per metro quadro */
export const sqftAedToSqmEur = (aed: number) => (aed * 10.7639) / AED_PER_EUR;

const S = {
  gulfNewsSales: { name: "Gulf News su dati Dubai Land Department", url: "https://gulfnews.com/business/property/dubai-property-market-closes-2025-with-record-dh6825-billion-in-sales-1.500396068", date: "2025" },
  population: { name: "Digital Dubai, via Gulf News", url: "https://gulfnews.com/uae/biggest-jump-how-dubais-population-crosses-458m-1.500625403", date: "fine 2025" },
  yieldEV: { name: "Engel & Völkers su dati Property Monitor", url: "https://www.engelvoelkers.com/ae/en/resources/rental-yield-dubai", date: "set 2025" },
  handovers: { name: "Cavendish Maxwell, FY2025", url: "https://cavendishmaxwell.com/insights/market-reports/residential/dubai-residential-market-performance-fy-2025", date: "2025" },
  investors: { name: "Dubai Land Department, via Gulf Business", url: "https://gulfbusiness.com/en/2025/economy/dubai-property-market-breaks-records/", date: "H1 2025" },
  priceEV: { name: "Engel & Völkers", url: "https://www.engelvoelkers.com/ae/en/resources/average-price-per-square-foot-in-dubai", date: "2026" },
  downtown: { name: "District UAE", url: "https://www.districtuae.com/market-data/downtown-dubai", date: "2025" },
  hills: { name: "Metropolitan Premium Properties", url: "https://metropolitan.realestate/resale-reports/dubai-hills-estate-apartments-2025-resale-report/", date: "2025" },
  marina: { name: "Tranio (off-plan) e portali (rivendita)", url: "https://tranio.com/uae/prices/", date: "2025" },
  yields: { name: "Data Habibi / Global Property Guide", url: "https://datahabibi.ae/blog/dubai-rental-yields", date: "2025–26" },
  estimates: { name: "Real Estate Club Dubai (stime di mercato)", url: "https://realestateclubdubai.com/dubai-real-estate-statistics", date: "2026" },
} satisfies Record<string, Source>;

/* ─── Numeri chiave (capitolo "Perché Dubai") ─────────────────────────────── */

export type KeyFact = {
  n: string;
  title: string;
  text: string;
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  caption: string;
  source: Source;
};

export const keyFacts: KeyFact[] = [
  {
    n: "01",
    title: "Una città che cresce",
    text: "Nel 2025 Dubai ha superato i 4,5 milioni di residenti.",
    value: 332000, prefix: "+",
    caption: "nuovi residenti nel 2025 (+7,5%)",
    source: S.population,
  },
  {
    n: "02",
    title: "Un mercato liquido",
    text: "Un volume di compravendite da record, nel 2025.",
    value: 214912,
    caption: "compravendite registrate nel 2025 (+30% sul valore)",
    source: S.gulfNewsSales,
  },
  {
    n: "03",
    title: "Capitale internazionale",
    text: "Ogni anno arrivano decine di migliaia di nuovi investitori.",
    value: 59075,
    caption: "nuovi investitori nel solo primo semestre 2025",
    source: S.investors,
  },
  {
    n: "04",
    title: "Rendimenti diversi",
    text: "Il rendimento lordo medio degli appartamenti. Lordo, quindi prima di spese e sfitto.",
    value: 7.25, decimals: 2, suffix: "%",
    caption: "rendimento lordo medio, appartamenti",
    source: S.yieldEV,
  },
  {
    n: "05",
    title: "Una città in costruzione",
    text: "Nuova offerta ogni anno: opportunità, ma anche concorrenza.",
    value: 40400, prefix: "~",
    caption: "nuove unità residenziali consegnate nel 2025",
    source: S.handovers,
  },
];

export const marketTotals = {
  salesValueAed: 682.5e9, // Gulf News su dati DLD, 2025
  salesValueSource: S.gulfNewsSales,
};

/* ─── Confronto Italia / Dubai ───────────────────────────────────────────── */

export type Lean = "strength" | "consider" | "neutral";
export type ComparisonFactor = { id: string; label: string; italy: { text: string; lean: Lean }; dubai: { text: string; lean: Lean } };

export const comparisonFactors: ComparisonFactor[] = [
  {
    id: "demand", label: "Domanda",
    italy: { text: "Forte nelle grandi città, debole dove la popolazione cala.", lean: "neutral" },
    dubai: { text: "Spinta da nuovi residenti: +332.000 solo nel 2025.", lean: "strength" },
  },
  {
    id: "yield", label: "Rendimenti",
    italy: { text: "Contenuti nelle grandi città, con costi e tempi di gestione alti.", lean: "consider" },
    dubai: { text: "Lordi medi intorno al 7% sugli appartamenti. Mai garantiti.", lean: "strength" },
  },
  {
    id: "tax", label: "Fiscalità",
    italy: { text: "IMU sulle seconde case e tassazione degli affitti.", lean: "consider" },
    dubai: { text: "Nessuna imposta sul reddito personale negli EAU. Ma un residente italiano dichiara in Italia.", lean: "consider" },
  },
  {
    id: "risk", label: "Rischio",
    italy: { text: "Mercato maturo e stabile, con prezzi spesso fermi.", lean: "neutral" },
    dubai: { text: "Più dinamico e più volatile, con cicli marcati e rischio di cambio.", lean: "consider" },
  },
  {
    id: "remote", label: "Gestione",
    italy: { text: "Vicinanza e lingua rendono tutto più semplice.", lean: "strength" },
    dubai: { text: "A distanza: servono partner locali affidabili.", lean: "consider" },
  },
];

/* ─── Aree (capitolo mappa) ──────────────────────────────────────────────── */

export type Area = {
  id: string;
  name: string;
  profile: string;
  summary: string;
  types: string;
  /** AED per piede quadro (singolo valore o intervallo) */
  priceSqftAed: number | [number, number];
  /** rendimento lordo % (singolo valore o intervallo) */
  grossYield: number | [number, number];
  source: Source;
};

export const areas: Area[] = [
  { id: "downtown", name: "Downtown Dubai", profile: "Premium · Iconico", summary: "Il centro attorno al Burj Khalifa.", types: "Appartamenti in torre", priceSqftAed: 3170, grossYield: [4.9, 5.7], source: S.downtown },
  { id: "business-bay", name: "Business Bay", profile: "Urbano · Rendimento", summary: "Uffici e residenze lungo il canale.", types: "Studio e 1 camera", priceSqftAed: 2547, grossYield: [4.9, 6.3], source: S.priceEV },
  { id: "marina", name: "Dubai Marina", profile: "Lifestyle · Domanda solida", summary: "Torri sul mare, affitti molto richiesti.", types: "Appartamenti vista mare", priceSqftAed: [2190, 3830], grossYield: [5.6, 6.5], source: S.marina },
  { id: "palm", name: "Palm Jumeirah", profile: "Premium · Patrimoniale", summary: "L'isola più riconoscibile al mondo.", types: "Ville e fronte mare", priceSqftAed: 3800, grossYield: 4.7, source: S.estimates },
  { id: "jvc", name: "Jumeirah Village Circle", profile: "Rendimento · Accessibile", summary: "Prezzi d'ingresso più bassi, affitti alti.", types: "Studio, 1 camera, townhouse", priceSqftAed: 1510, grossYield: [6.5, 7.8], source: S.priceEV },
  { id: "dubai-hills", name: "Dubai Hills", profile: "Famiglie · Crescita", summary: "Comunità verde con parco, golf e scuole.", types: "Ville, townhouse, appartamenti", priceSqftAed: 2352, grossYield: 5.5, source: S.hills },
  { id: "creek-harbour", name: "Dubai Creek Harbour", profile: "Crescita · In sviluppo", summary: "Nuovo distretto sul Creek, molto off-plan.", types: "Off-plan, vista Creek", priceSqftAed: 2500, grossYield: 5.1, source: S.estimates },
];

export const fmtRange = (v: number | [number, number], f: (n: number) => string) => (Array.isArray(v) ? `${f(v[0])}–${f(v[1])}` : f(v));

/* ─── Esempio di investimento ────────────────────────────────────────────────
 * Costruito su medie di mercato 2025 (Dubai Hills, appartamento 1 camera).
 * Prezzo: 800 ft² × AED 2.352/ft² (Metropolitan, 2025).
 * Affitto: rendimento lordo 5,5% (stima di area).
 * Service charges e gestione: STIME prudenziali, da verificare sul singolo edificio.
 * Non è un'offerta né un immobile reale.
 */
export const exampleInvestment = {
  area: "Dubai Hills",
  type: "1 camera · 74 m²",
  priceAed: 1_880_000,
  annualRentAed: 103_400,
  serviceChargesAed: 16_000, // stima ≈ AED 20/ft²
  managementAed: 16_000, // stima: gestione, sfitto, manutenzione
  dldFeeRate: 0.04, // tassa di registrazione Dubai Land Department
  holdingYears: 5,
  riskProfile: "Medio" as const,
  resaleScenarios: [
    { label: "Sfavorevole", change: -0.1 },
    { label: "Neutro", change: 0 },
    { label: "Favorevole", change: 0.15 },
  ],
  sources: [S.hills, S.yields],
};

export function computeExample(e = exampleInvestment) {
  const netAed = e.annualRentAed - e.serviceChargesAed - e.managementAed;
  return {
    netAed,
    grossYield: (e.annualRentAed / e.priceAed) * 100,
    netYield: (netAed / e.priceAed) * 100,
    dldAed: e.priceAed * e.dldFeeRate,
  };
}
