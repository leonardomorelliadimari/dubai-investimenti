# Dubai · Guida immobiliare per investitori italiani

Next.js 15 (export statico) · React 19 · TypeScript · Tailwind CSS v4 · Framer Motion · Lenis · Three.js / React Three Fiber.

Online su GitHub Pages: ogni push su `main` ripubblica il sito (`.github/workflows/deploy.yml`).

```bash
npm install
npm run dev     # http://localhost:3000
npm run build && npm start
```

## Dove si trovano i dati

| File | Contenuto |
| --- | --- |
| `src/data/dubaiMarket.ts` | **Tutti** i dati di mercato con fonte e data (DLD, Digital Dubai, Cavendish Maxwell, Engel & Völkers, Metropolitan…), cambio €/AED, aree, esempio di investimento. Ricontrollare prima di ogni aggiornamento. |
| `src/data/site.ts` | Nome brand (placeholder), contatti, segnali di fiducia (licenze, team, stampa, partner: vuoti → non mostrati), principi. |

Cerca `PLACEHOLDER_` per trovare ciò che va completato (brand, contatti, testi legali).

## Prima di andare online

- Sostituire brand, logo (`LogoMark` in `src/components/Loader.tsx`) e `site.url`.
- Far rivedere i testi fiscali (`comparisonFactors`) a un consulente.
- Form: il sito è statico. Crea un endpoint (es. Formspree), salvalo come variabile `FORM_ENDPOINT` nel repository GitHub e attiva la riga `NEXT_PUBLIC_FORM_ENDPOINT` nel workflow. Senza endpoint il form apre l'email del visitatore già compilata (`src/lib/lead.ts`).
- Redigere Privacy, Cookie e Termini.

## Struttura

- `src/components/sections/*` — una sezione per file, nell'ordine della pagina (`src/app/page.tsx`).
- `src/components/ui/*` — primitive riutilizzabili (MagneticButton, AnimatedText, CountUp, TiltCard, ScrollPhrase…).
- `src/components/world/*` — il mondo 3D unico dietro la pagina: Dubai procedurale (Burj Khalifa, città, mare, Palm, cantiere con gru), camera guidata dallo scroll, qualità adattiva.
- `src/app/investimenti` — questionario investitore multi-step; `src/app/contatti` — form contatti.

Le sequenze guidate dallo scroll usano `position: sticky` + `useScroll` di Framer Motion; con `prefers-reduced-motion` Lenis è disattivato e le sezioni pinned mostrano una versione statica.
