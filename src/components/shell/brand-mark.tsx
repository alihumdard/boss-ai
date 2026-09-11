"use client";

import { motion } from "framer-motion";

/** Concentric glowing rings used as the BOSS logo glyph. */
export function BrandMark({ size = 44 }: { size?: number }) {
  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <div className="absolute inset-0 rounded-full bg-cyan/15 blur-md" />
      <div className="absolute inset-0 rounded-full border border-cyan/50" />
      <motion.div
        className="absolute inset-[3px] rounded-full border border-cyan/70"
        animate={{ rotate: 360 }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
        style={{ borderTopColor: "transparent", borderLeftColor: "transparent" }}
      />
      <div className="absolute inset-[7px] rounded-full border border-cyan/30" />
      <div className="absolute inset-0 m-auto size-[9px] rounded-full bg-cyan shadow-[0_0_12px_var(--boss-cyan)]" />
    </div>
  );
}
