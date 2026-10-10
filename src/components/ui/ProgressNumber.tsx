"use client";
import { motion, type MotionValue, useTransform } from "framer-motion";
import { num } from "@/lib/format";

/** Numero che "conta" legato al progresso di scroll (nessun timer, nessun re-render). */
export function ProgressNumber({ p, at, value, decimals = 0, prefix = "", suffix = "", className = "" }: { p: MotionValue<number>; at: number; value: number; decimals?: number; prefix?: string; suffix?: string; className?: string }) {
  const v = useTransform(p, [at, at + 0.08], [0, value], { clamp: true });
  const txt = useTransform(v, (x) => `${prefix}${num(x, decimals)}${suffix}`);
  return <motion.span className={`tabular ${className}`}>{txt}</motion.span>;
}
