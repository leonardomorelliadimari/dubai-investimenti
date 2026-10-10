"use client";
import { motion, type MotionValue, useTransform } from "framer-motion";

const spring = [0.2, 1.3, 0.4, 1] as const; // leggero overshoot: "pop" elegante, non rimbalzo

/** Elemento che "spunta" quando entra nel viewport. */
export function Pop({ children, className = "", delay = 0, as = "div" }: { children: React.ReactNode; className?: string; delay?: number; as?: "div" | "li" | "article" }) {
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y: 36, scale: 0.94 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.75, ease: spring, delay }}
    >
      {children}
    </Tag>
  );
}

/** Elemento che appare e (opzionale) scompare in un intervallo del progresso di un capitolo. */
export function RangePop({
  p, at, out, children, className = "", from = "up",
}: { p: MotionValue<number>; at: number; out?: number; children: React.ReactNode; className?: string; from?: "up" | "left" | "right" }) {
  const f = 0.05;
  const input = out === undefined ? [at, at + f] : [at, at + f, out - f, out];
  const opacity = useTransform(p, input, out === undefined ? [0, 1] : [0, 1, 1, 0]);
  const scale = useTransform(p, input, out === undefined ? [0.92, 1] : [0.92, 1, 1, 0.97]);
  const d = from === "left" ? -40 : from === "right" ? 40 : 0;
  const x = useTransform(p, input, out === undefined ? [d, 0] : [d, 0, 0, -d * 0.5]);
  const y = useTransform(p, input, out === undefined ? [from === "up" ? 40 : 0, 0] : [from === "up" ? 40 : 0, 0, 0, from === "up" ? -30 : 0]);
  const pe = useTransform(opacity, (o) => (o > 0.5 ? "auto" : "none"));
  return (
    <motion.div style={{ opacity, scale, x, y, pointerEvents: pe }} className={`will-change-transform ${className}`}>
      {children}
    </motion.div>
  );
}
