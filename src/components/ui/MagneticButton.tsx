"use client";
import Link from "next/link";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useRef } from "react";
import { useFinePointer } from "@/hooks/useMediaQuery";

type Variant = "primary" | "secondary" | "light" | "ghost-light";

const styles: Record<Variant, string> = {
  primary: "bg-ink text-ivory hover:bg-ink-3",
  secondary: "border border-ink/15 text-ink hover:border-ink/40 bg-transparent",
  light: "bg-ivory text-ink hover:bg-white",
  "ghost-light": "border border-ivory/20 text-ivory hover:border-ivory/50",
};

type Props = {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: Variant;
  strength?: number;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  arrow?: boolean;
  ariaLabel?: string;
};

export function MagneticButton({
  children, href, onClick, variant = "primary", strength = 0.28, className = "", type = "button", disabled, arrow, ariaLabel,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const fine = useFinePointer();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 22, mass: 0.3 });
  const sy = useSpring(y, { stiffness: 260, damping: 22, mass: 0.3 });

  const onMove = (e: React.PointerEvent) => {
    if (!fine || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const reset = () => { x.set(0); y.set(0); };

  const cls = `group relative inline-flex h-13 items-center justify-center gap-3 overflow-hidden rounded-full px-7 text-[0.9375rem] font-medium tracking-[-0.01em] transition-colors duration-500 ease-[var(--ease-premium)] disabled:opacity-40 ${styles[variant]} ${className}`;
  const inner = (
    <>
      <span className="relative">{children}</span>
      {arrow && (
        <span aria-hidden className="relative inline-block transition-transform duration-500 ease-[var(--ease-premium)] group-hover:translate-x-1">
          →
        </span>
      )}
    </>
  );

  return (
    <motion.div
      ref={ref}
      style={{ x: sx, y: sy }}
      onPointerMove={onMove}
      onPointerLeave={reset}
      className="inline-block"
      data-cursor="hover"
    >
      {href ? (
        href.startsWith("#") ? (
          <a href={href} onClick={(e) => { if (onClick) { e.preventDefault(); onClick(); } }} className={cls} aria-label={ariaLabel}>{inner}</a>
        ) : (
          <Link href={href} onClick={onClick} className={cls} aria-label={ariaLabel}>{inner}</Link>
        )
      ) : (
        <button type={type} onClick={onClick} className={cls} disabled={disabled} aria-label={ariaLabel}>{inner}</button>
      )}
    </motion.div>
  );
}
