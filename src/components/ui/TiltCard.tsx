"use client";
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";
import { useFinePointer } from "@/hooks/useMediaQuery";

/** Card con tilt 3D molto leggero (max ~3°) e riflesso morbido. */
export function TiltCard({ children, className = "", max = 3 }: { children: React.ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const fine = useFinePointer();
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rx = useSpring(useTransform(py, [0, 1], [max, -max]), { stiffness: 120, damping: 20 });
  const ry = useSpring(useTransform(px, [0, 1], [-max, max]), { stiffness: 120, damping: 20 });
  const gx = useTransform(px, (v) => `${v * 100}%`);
  const gy = useTransform(py, (v) => `${v * 100}%`);
  const glare = useMotionTemplate`radial-gradient(420px circle at ${gx} ${gy}, rgb(255 255 255 / 0.55), transparent 60%)`;

  return (
    <motion.div
      ref={ref}
      onPointerMove={(e) => {
        if (!fine || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        px.set((e.clientX - r.left) / r.width);
        py.set((e.clientY - r.top) / r.height);
      }}
      onPointerLeave={() => { px.set(0.5); py.set(0.5); }}
      style={{ rotateX: fine ? rx : 0, rotateY: fine ? ry : 0, transformPerspective: 1200 }}
      className={`group relative ${className}`}
    >
      {children}
      {fine && <motion.div aria-hidden style={{ background: glare }} className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 mix-blend-soft-light transition-opacity duration-500 group-hover:opacity-100" />}
    </motion.div>
  );
}
