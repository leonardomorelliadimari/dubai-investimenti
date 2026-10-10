"use client";
import Link from "next/link";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { navItems, site } from "@/data/site";
import { LogoMark } from "./Loader";
import { MagneticButton } from "./ui/MagneticButton";
import { useLenis, useScrollTo } from "./SmoothScroll";

export function Navigation() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [dark, setDark] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";
  const scrollTo = useScrollTo();
  const lenis = useLenis();

  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 40));

  // Sezione attiva + tema (chiaro/scuro) della sezione sotto la navbar
  useEffect(() => {
    if (!isHome) return;
    const update = () => {
      const probe = 36;
      let current: string | null = null;
      for (const { id } of navItems) {
        const el = document.getElementById(id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.top <= window.innerHeight * 0.4 && r.bottom > window.innerHeight * 0.4) current = id;
      }
      setActive(current);
      const darkEls = document.querySelectorAll<HTMLElement>("[data-theme='dark']");
      let d = false;
      darkEls.forEach((el) => { const r = el.getBoundingClientRect(); if (r.top <= probe && r.bottom >= probe) d = true; });
      setDark(d);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => { window.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, [isHome]);

  useEffect(() => {
    if (open) lenis?.stop(); else lenis?.start();
    document.body.style.overflow = open ? "hidden" : "";
  }, [open, lenis]);

  const go = (id: string) => (e: React.MouseEvent) => {
    if (!isHome) return;
    e.preventDefault();
    setOpen(false);
    scrollTo(id);
  };

  const fg = dark && !open ? "text-ivory" : "text-ink";

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color,color] duration-700 ease-[var(--ease-premium)] ${fg} ${
          scrolled && !open
            ? dark ? "border-b border-ivory/[0.06] bg-night/85" : "border-b border-ink/[0.06] bg-ivory/92"
            : "border-b border-transparent"
        }`}
      >
        <nav aria-label="Principale" className="mx-auto flex h-18 max-w-[1680px] items-center justify-between px-5 md:px-10">
          <Link href="/" className="flex items-center gap-2.5" aria-label={`${site.brandName} – Home`} onClick={(e) => { if (isHome) { e.preventDefault(); setOpen(false); if (lenis) lenis.scrollTo(0, { duration: 1.6 }); else window.scrollTo({ top: 0, behavior: "smooth" }); } }}>
            <LogoMark className="h-[22px] w-[22px]" />
            <span className="text-[0.9375rem] font-medium tracking-[-0.02em]">{site.brandName}</span>
          </Link>

          <ul className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <li key={item.id}>
                <Link
                  href={isHome ? `#${item.id}` : `/#${item.id}`}
                  onClick={go(item.id)}
                  aria-current={active === item.id ? "true" : undefined}
                  className="relative px-3.5 py-2 text-[0.8125rem] tracking-[-0.005em] opacity-70 transition-opacity duration-300 hover:opacity-100 aria-[current]:opacity-100"
                >
                  {item.label}
                  {active === item.id && (
                    <motion.span layoutId="nav-active" className="absolute inset-x-3.5 -bottom-0.5 h-px bg-current" transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} />
                  )}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <MagneticButton href="/investimenti" variant={dark ? "light" : "primary"} className="!h-10 !px-5 !text-[0.8125rem]">
                Scopri gli investimenti
              </MagneticButton>
            </div>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="relative flex h-10 w-10 items-center justify-center lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Chiudi menu" : "Apri menu"}
            >
              <span className={`absolute h-px w-5 bg-current transition-transform duration-500 ease-[var(--ease-premium)] ${open ? "rotate-45" : "-translate-y-[4px]"}`} />
              <span className={`absolute h-px w-5 bg-current transition-transform duration-500 ease-[var(--ease-premium)] ${open ? "-rotate-45" : "translate-y-[4px]"}`} />
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            className="fixed inset-0 z-40 flex flex-col bg-ivory px-5 pb-10 pt-28 lg:hidden"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
          >
            <ul className="flex flex-col">
              {navItems.map((item, i) => (
                <motion.li key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05, duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="border-b border-ink/[0.08]">
                  <Link href={isHome ? `#${item.id}` : `/#${item.id}`} onClick={go(item.id)} className="flex items-baseline justify-between py-5 text-3xl font-medium tracking-[-0.03em]">
                    {item.label}
                    <span className="eyebrow text-mist">0{i + 1}</span>
                  </Link>
                </motion.li>
              ))}
            </ul>
            <div className="mt-auto">
              <MagneticButton href="/investimenti" className="w-full" arrow onClick={() => setOpen(false)}>Scopri gli investimenti</MagneticButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
