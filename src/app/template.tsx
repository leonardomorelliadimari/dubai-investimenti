"use client";
import { motion } from "framer-motion";

/** Transizione morbida tra route. */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}
