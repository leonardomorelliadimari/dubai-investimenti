"use client";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { MagneticButton } from "./ui/MagneticButton";
import { easePremium } from "@/lib/motion";
import { submitLead } from "@/lib/lead";

type Question = { id: keyof Answers; title: string; hint?: string; options: string[] };
type Answers = { capital?: string; goal?: string; horizon?: string; experience?: string; timing?: string };

const questions: Question[] = [
  { id: "capital", title: "Quanto capitale stai valutando di investire?", options: ["< €100.000", "€100.000 – €250.000", "€250.000 – €500.000", "€500.000 – €1M", "Oltre €1M"] },
  { id: "goal", title: "Qual è il tuo obiettivo principale?", options: ["Rendita", "Crescita del capitale", "Diversificazione", "Casa personale + investimento", "Non lo so ancora"] },
  { id: "horizon", title: "Per quanto tempo pensi di mantenere l'investimento?", options: ["< 3 anni", "3–5 anni", "5–10 anni", "10+ anni"] },
  { id: "experience", title: "Hai già investimenti immobiliari?", options: ["Sì, in Italia", "Sì, all'estero", "Entrambi", "No"] },
  { id: "timing", title: "Quando vorresti investire?", options: ["Subito", "Entro 3 mesi", "Entro 6 mesi", "Sto solo esplorando"] },
];

const TOTAL = questions.length;
const PROFILE_STEP = TOTAL;
const CONTACT_STEP = TOTAL + 1;
const DONE_STEP = TOTAL + 2;
const STORAGE = "investor-questionnaire";

/** Lettura qualitativa del profilo: nessun numero, nessuna promessa. */
function buildProfile(a: Answers) {
  const strategy: Record<string, { title: string; text: string }> = {
    Rendita: { title: "Orientamento: rendita", text: "Immobili pronti, in aree con una domanda di locazione consolidata e costi di gestione chiari." },
    "Crescita del capitale": { title: "Orientamento: crescita", text: "Aree in sviluppo e progetti selezionati, anche off-plan, valutando con attenzione developer e tempi di consegna." },
    Diversificazione: { title: "Orientamento: diversificazione", text: "Un'esposizione misurata al mercato, con attenzione a rischio di cambio, liquidità e peso sul patrimonio complessivo." },
    "Casa personale + investimento": { title: "Orientamento: uso misto", text: "Comunità residenziali con servizi, adatte sia a soggiorni personali sia alla locazione nei periodi di assenza." },
    "Non lo so ancora": { title: "Orientamento: da definire", text: "Partiamo da una conversazione esplorativa per capire quale strategia è coerente con te. Anche concludere che non lo è." },
  };
  const notes: string[] = [];
  if (a.horizon === "< 3 anni") notes.push("Con un orizzonte breve, i costi di acquisto e di rivendita pesano molto sul risultato: è un elemento da valutare con attenzione.");
  if (a.horizon === "5–10 anni" || a.horizon === "10+ anni") notes.push("Un orizzonte medio-lungo permette di attraversare eventuali fasi di mercato meno favorevoli.");
  if (a.capital === "< €100.000") notes.push("Con questo capitale le opzioni si concentrano su tagli compatti o progetti con piani di pagamento dilazionati.");
  if (a.experience === "No") notes.push("Essendo il primo investimento immobiliare, daremo particolare spazio a costi, processo e rischi.");
  if (a.experience === "Sì, in Italia") notes.push("Avendo già immobili in Italia, ha senso ragionare su come Dubai si integra nel patrimonio esistente.");
  if (a.timing === "Sto solo esplorando") notes.push("Nessuna fretta: riceverai prima materiale informativo, poi eventualmente delle opportunità.");
  return { ...(strategy[a.goal ?? "Non lo so ancora"] ?? strategy["Non lo so ancora"]), notes };
}

const slide = {
  initial: (d: number) => ({ opacity: 0, y: d > 0 ? 40 : -40, filter: "blur(6px)" }),
  animate: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, delay: 0.12, ease: easePremium } },
  exit: (d: number) => ({ opacity: 0, y: d > 0 ? -30 : 30, filter: "blur(6px)", pointerEvents: "none" as const, transition: { duration: 0.3, ease: easePremium } }),
};

export function InvestmentQuestionnaire() {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [answers, setAnswers] = useState<Answers>({});
  const [contact, setContact] = useState({ name: "", email: "", phone: "", consent: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // ripristino stato + integrazione con il tasto "indietro" del browser
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE) ?? "null");
      if (saved?.answers) setAnswers(saved.answers);
    } catch {}
    history.replaceState({ ...history.state, step: 0 }, "");
    const onPop = (e: PopStateEvent) => {
      const s = typeof e.state?.step === "number" ? e.state.step : 0;
      setDir(-1);
      setStep(s);
    };
    window.addEventListener("popstate", onPop);
    return () => { window.removeEventListener("popstate", onPop); clearTimeout(advanceTimer.current); };
  }, []);

  useEffect(() => {
    try { sessionStorage.setItem(STORAGE, JSON.stringify({ answers })); } catch {}
  }, [answers]);

  useEffect(() => { headingRef.current?.focus({ preventScroll: true }); window.scrollTo({ top: 0 }); }, [step]);

  const goTo = useCallback((s: number) => {
    setDir(s > step ? 1 : -1);
    setStep(s);
    if (s > step) history.pushState({ ...history.state, step: s }, "");
  }, [step]);

  const back = () => { if (step > 0 && step < DONE_STEP) history.back(); };

  const choose = (q: Question, opt: string) => {
    setAnswers((a) => ({ ...a, [q.id]: opt }));
    clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => goTo(step + 1), 420);
  };

  // tastiera: 1–5 per scegliere
  useEffect(() => {
    if (step >= TOTAL) return;
    const q = questions[step];
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      const n = Number(e.key);
      if (n >= 1 && n <= q.options.length) choose(q, q.options[n - 1]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (contact.name.trim().length < 2) e.name = "Inserisci il tuo nome.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contact.email.trim())) e.email = "Inserisci un indirizzo email valido.";
    if (contact.phone.trim() && !/^[+()\d\s.-]{6,20}$/.test(contact.phone.trim())) e.phone = "Numero di telefono non valido.";
    if (!contact.consent) e.consent = "Serve il consenso per poterti ricontattare.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      await submitLead({ type: "questionnaire", answers, contact });
      try { sessionStorage.removeItem(STORAGE); } catch {}
      goTo(DONE_STEP);
    } catch {
      setSubmitError("Non è stato possibile inviare la richiesta. Riprova tra qualche istante.");
    } finally {
      setSubmitting(false);
    }
  };

  const progress = Math.min(step, TOTAL) / TOTAL;
  const profile = buildProfile(answers);

  return (
    <div className="relative mx-auto flex min-h-[100svh] w-full max-w-3xl flex-col px-5 pb-10 pt-28 md:pt-36">
      {/* progresso */}
      {step < DONE_STEP && (
        <div className="mb-12 md:mb-16">
          <div className="flex items-center justify-between text-xs">
            <button onClick={back} disabled={step === 0} className="link-underline flex items-center gap-2 text-graphite transition-opacity disabled:pointer-events-none disabled:opacity-0" aria-label="Domanda precedente">
              ← Indietro
            </button>
            <span className="tabular text-mist" aria-live="polite">
              {step < TOTAL ? `${String(step + 1).padStart(2, "0")} / ${String(TOTAL).padStart(2, "0")}` : step === PROFILE_STEP ? "Il tuo profilo" : "Ultimo passo"}
            </span>
          </div>
          <div className="mt-4 flex gap-1.5" role="progressbar" aria-valuemin={0} aria-valuemax={TOTAL} aria-valuenow={Math.min(step, TOTAL)} aria-label="Avanzamento questionario">
            {questions.map((_, i) => (
              <div key={i} className="h-[2px] flex-1 overflow-hidden rounded-full bg-ink/10">
                <motion.div className="h-full bg-ink" initial={false} animate={{ scaleX: i < step ? 1 : 0 }} style={{ originX: 0 }} transition={{ duration: 0.6, ease: easePremium }} />
              </div>
            ))}
          </div>
          <span className="sr-only">{Math.round(progress * 100)}% completato</span>
        </div>
      )}

      <div className="relative grid flex-1 [&>*]:[grid-area:1/1]">
        <AnimatePresence custom={dir} initial={false}>
          {step < TOTAL && (
            <motion.fieldset key={`q${step}`} custom={dir} variants={slide} initial="initial" animate="animate" exit="exit">
              <legend className="sr-only">{questions[step].title}</legend>
              <h1 ref={headingRef} tabIndex={-1} className="text-balance text-[clamp(2rem,5.2vw,3.75rem)] font-medium leading-[1.02] tracking-[-0.045em] outline-none">
                {questions[step].title}
              </h1>
              <div className="mt-10 grid gap-2.5 md:mt-14" role="radiogroup" aria-label={questions[step].title}>
                {questions[step].options.map((opt, i) => {
                  const selected = answers[questions[step].id] === opt;
                  return (
                    <motion.button
                      key={opt}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => choose(questions[step], opt)}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + i * 0.05, duration: 0.6, ease: easePremium }}
                      className={`group relative flex min-h-[64px] items-center justify-between overflow-hidden rounded-2xl border px-5 text-left text-lg tracking-[-0.015em] transition-colors duration-300 md:px-6 md:text-xl ${
                        selected ? "border-ink text-ivory" : "border-ink/10 bg-white/50 hover:border-ink/30 hover:bg-white"
                      }`}
                    >
                      {selected && <motion.span layoutId={`sel-${step}`} className="absolute inset-0 bg-ink" transition={{ duration: 0.45, ease: easePremium }} />}
                      <span className="relative">{opt}</span>
                      <span className={`tabular relative hidden h-7 w-7 items-center justify-center rounded-full border text-xs md:flex ${selected ? "border-ivory/30 text-ivory/70" : "border-ink/10 text-mist"}`}>{i + 1}</span>
                    </motion.button>
                  );
                })}
              </div>
              <p className="mt-6 hidden text-xs text-mist md:block">Suggerimento: puoi rispondere anche con i tasti 1–{questions[step].options.length}.</p>
            </motion.fieldset>
          )}

          {step === PROFILE_STEP && (
            <motion.div key="profile" custom={dir} variants={slide} initial="initial" animate="animate" exit="exit">
              <p className="eyebrow text-bronze">Una prima lettura</p>
              <h1 ref={headingRef} tabIndex={-1} className="mt-4 text-[clamp(2rem,5.2vw,3.75rem)] font-medium leading-[1.02] tracking-[-0.045em] outline-none">{profile.title}</h1>
              <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-graphite">{profile.text}</p>

              <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-ink/[0.08] bg-ink/[0.08] sm:grid-cols-3">
                {questions.map((q) => (
                  <div key={q.id} className="bg-ivory p-4 md:p-5">
                    <dt className="eyebrow text-[0.625rem] text-mist">{{ capital: "Capitale", goal: "Obiettivo", horizon: "Orizzonte", experience: "Esperienza", timing: "Tempistica" }[q.id]}</dt>
                    <dd className="mt-2 text-sm font-medium">{answers[q.id] ?? "—"}</dd>
                  </div>
                ))}
              </dl>

              {profile.notes.length > 0 && (
                <ul className="mt-8 space-y-3">
                  {profile.notes.map((n) => <li key={n} className="flex gap-3 text-sm leading-relaxed text-graphite"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-bronze" />{n}</li>)}
                </ul>
              )}

              <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center">
                <MagneticButton onClick={() => goTo(CONTACT_STEP)} arrow>Mostrami le opportunità</MagneticButton>
                <button onClick={() => { setAnswers({}); try { sessionStorage.removeItem(STORAGE); } catch {} goTo(0); }} className="link-underline self-start text-sm text-graphite sm:self-center">Ricomincia</button>
              </div>
              <p className="mt-8 text-xs leading-relaxed text-mist">Questa lettura è indicativa e non costituisce consulenza finanziaria.</p>
            </motion.div>
          )}

          {step === CONTACT_STEP && (
            <motion.form key="contact" custom={dir} variants={slide} initial="initial" animate="animate" exit="exit" onSubmit={submit} noValidate>
              <p className="eyebrow text-bronze">Ultimo passo</p>
              <h1 ref={headingRef} tabIndex={-1} className="mt-4 text-[clamp(2rem,5.2vw,3.75rem)] font-medium leading-[1.02] tracking-[-0.045em] outline-none">A chi inviamo le opportunità compatibili?</h1>
              <p className="mt-5 max-w-lg text-graphite">Ti ricontatteremo per approfondire. Nessuna proposta prima di aver capito insieme se ha senso.</p>

              <div className="mt-10 space-y-3">
                <Field label="Nome" name="name" autoComplete="name" value={contact.name} error={errors.name} onChange={(v) => setContact((c) => ({ ...c, name: v }))} />
                <Field label="Email" name="email" type="email" inputMode="email" autoComplete="email" value={contact.email} error={errors.email} onChange={(v) => setContact((c) => ({ ...c, email: v }))} />
                <Field label="Telefono (facoltativo)" name="phone" type="tel" inputMode="tel" autoComplete="tel" value={contact.phone} error={errors.phone} onChange={(v) => setContact((c) => ({ ...c, phone: v }))} />
              </div>

              <label className="mt-6 flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-graphite">
                <input type="checkbox" checked={contact.consent} onChange={(e) => setContact((c) => ({ ...c, consent: e.target.checked }))} className="mt-1 h-4 w-4 shrink-0 accent-[#0b0e12]" aria-invalid={!!errors.consent} aria-describedby={errors.consent ? "consent-err" : undefined} />
                <span>Acconsento al trattamento dei dati per essere ricontattato, come descritto nell&apos;<Link href="/privacy" className="underline underline-offset-2">informativa privacy</Link>.</span>
              </label>
              {errors.consent && <p id="consent-err" className="mt-2 text-sm text-[#9a3b2e]">{errors.consent}</p>}

              <div className="mt-10">
                <MagneticButton type="submit" disabled={submitting} arrow>{submitting ? "Invio in corso…" : "Mostrami le opportunità"}</MagneticButton>
              </div>
              {submitError && <p role="alert" className="mt-4 text-sm text-[#9a3b2e]">{submitError}</p>}
            </motion.form>
          )}

          {step === DONE_STEP && (
            <motion.div key="done" variants={slide} custom={1} initial="initial" animate="animate" className="flex min-h-[60svh] flex-col justify-center">
              <motion.svg viewBox="0 0 48 48" className="h-12 w-12" initial="h" animate="s" aria-hidden>
                <circle cx="24" cy="24" r="22" fill="none" stroke="#0b0e12" strokeOpacity={0.15} />
                <motion.path d="M15 24.5l6 6 12-13" fill="none" stroke="#94784f" strokeWidth={1.6} variants={{ h: { pathLength: 0 }, s: { pathLength: 1, transition: { duration: 0.9, delay: 0.3, ease: easePremium } } }} />
              </motion.svg>
              <h1 ref={headingRef} tabIndex={-1} className="mt-8 text-[clamp(2rem,5.2vw,3.75rem)] font-medium leading-[1.02] tracking-[-0.045em] outline-none">Grazie{contact.name ? `, ${contact.name.split(" ")[0]}` : ""}.</h1>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-graphite">Abbiamo ricevuto il tuo profilo. Ti ricontatteremo per una prima conversazione, senza impegno.</p>
              <div className="mt-10"><MagneticButton href="/" variant="secondary">Torna alla guida</MagneticButton></div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

type FieldProps = {
  label: string; name: string; value: string; error?: string; onChange: (v: string) => void;
  type?: string; autoComplete?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
};

export function Field({ label, name, value, error, onChange, type = "text", autoComplete, inputMode }: FieldProps) {
  const id = `f-${name}`;
  return (
    <div>
      <div className={`group relative rounded-2xl border bg-white/60 transition-colors duration-300 focus-within:border-ink ${error ? "border-[#9a3b2e]/60" : "border-ink/10"}`}>
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          placeholder=" "
          autoComplete={autoComplete}
          inputMode={inputMode}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined}
          className="peer h-16 w-full rounded-2xl bg-transparent px-5 pt-5 text-lg outline-none"
        />
        <label htmlFor={id} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-graphite transition-all duration-300 ease-[var(--ease-premium)] peer-focus:top-4 peer-focus:text-xs peer-[:not(:placeholder-shown)]:top-4 peer-[:not(:placeholder-shown)]:text-xs">
          {label}
        </label>
      </div>
      {error && <p id={`${id}-err`} className="mt-1.5 px-1 text-sm text-[#9a3b2e]">{error}</p>}
    </div>
  );
}
