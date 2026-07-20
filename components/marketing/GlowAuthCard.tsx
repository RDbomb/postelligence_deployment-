"use client";

import { motion } from "framer-motion";
import React from "react";

export function GlowAuthCard({ children }: { children: React.ReactNode }) {
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      onMouseMove={handleMouseMove}
      className="glow-card w-full rounded-[28px]"
    >
      <div className="p-8 md:p-10 bg-white/90 border border-[#1f2528]/12 rounded-[28px] shadow-[0_28px_80px_rgba(31,37,40,0.14)] relative z-20 flex flex-col gap-6">
        {children}
      </div>
    </motion.div>
  );
}
