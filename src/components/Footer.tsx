import Link from "next/link";
import { site } from "@/data/site";
import { LogoMark } from "./Loader";

const cols = [
  { title: "Dubai", links: [{ label: "Il mercato", href: "/#mercato" }, { label: "Perché Dubai", href: "/#perche-dubai" }, { label: "Off-plan", href: "/#off-plan" }] },
  { title: "Investire", links: [{ label: "Strategie", href: "/#strategie" }, { label: "Rischi", href: "/#rischi" }, { label: "Come funziona", href: "/#come-funziona" }] },
  { title: "Aree", links: [{ label: "Downtown Dubai", href: "/#aree" }, { label: "Dubai Marina", href: "/#aree" }, { label: "Dubai Hills", href: "/#aree" }, { label: "Creek Harbour", href: "/#aree" }] },
  { title: "Contatti", links: [{ label: "Questionario investitore", href: "/investimenti" }, { label: "Parla con noi", href: "/contatti" }, { label: site.contact.email, href: `mailto:${site.contact.email}` }] },
];

export function Footer() {
  return (
    <footer className="relative bg-night text-ivory" data-theme="dark">
      <div className="mx-auto max-w-[1680px] px-5 pb-10 pt-24 md:px-10">
        <div className="grid gap-16 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <LogoMark className="h-6 w-6" />
              <span className="font-medium tracking-[-0.02em]">{site.brandName}</span>
            </div>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-ivory/50">{site.brandTagline}. Informazione prima della proposta.</p>
          </div>
          <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
            {cols.map((c) => (
              <div key={c.title}>
                <h3 className="eyebrow mb-5 text-sand">{c.title}</h3>
                <ul className="space-y-3">
                  {c.links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="link-underline text-sm [overflow-wrap:anywhere] text-ivory/65 transition-colors hover:text-ivory">{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-24 border-t border-ivory/10 pt-8">
          <p className="max-w-4xl text-xs leading-relaxed text-ivory/45">
            I contenuti presenti su questo sito hanno finalità esclusivamente informative e non costituiscono consulenza finanziaria, fiscale o legale. Ogni investimento comporta rischi e deve essere valutato in relazione alla propria situazione personale.
          </p>
          <div className="mt-8 flex flex-col-reverse gap-4 text-xs text-ivory/40 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} {site.brandName}</p>
            <ul className="flex gap-6">
              <li><Link className="link-underline hover:text-ivory" href="/privacy">Privacy</Link></li>
              <li><Link className="link-underline hover:text-ivory" href="/cookie">Cookie</Link></li>
              <li><Link className="link-underline hover:text-ivory" href="/termini">Termini</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
