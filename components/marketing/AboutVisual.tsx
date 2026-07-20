"use client";

import { motion } from "framer-motion";
import { Heart, Target, Sparkles } from "lucide-react";

export function AboutVisual() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[380px] flex items-center justify-center p-8 bg-gradient-to-tr from-slate-50 to-white/40 border border-[#1f2528]/8 rounded-3xl shadow-[0_24px_50px_rgba(31,37,40,0.04)] overflow-hidden">
      
      {/* Concentric Pulsing Rings */}
      <motion.div
        animate={{ scale: [0.95, 1.05, 0.95] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute h-64 w-64 rounded-full border border-[#2f7867]/5 flex items-center justify-center"
      >
        <motion.div
          animate={{ scale: [0.92, 1.08, 0.92] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="h-44 w-44 rounded-full border border-dashed border-[#2f7867]/10 flex items-center justify-center"
        >
          <motion.div
            animate={{ scale: [0.9, 1.1, 0.9] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="h-28 w-28 rounded-full border border-[#2f7867]/15 flex items-center justify-center"
          />
        </motion.div>
      </motion.div>

      {/* Central Core: Core Values in Orbit */}
      <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-white border border-[#1f2528]/8 shadow-[0_12px_32px_rgba(31,37,40,0.06)]">
        <Heart className="h-8 w-8 text-[#a53b28] fill-current animate-pulse" />
      </div>

      {/* Outer Floating Value Icons */}
      {[
        { icon: Target, label: "Clarity", x: -90, y: -70, color: "#2f7867" },
        { icon: Sparkles, label: "Calm AI", x: 90, y: 70, color: "#7a5a00" }
      ].map((val, idx) => {
        const Icon = val.icon;
        return (
          <motion.div
            key={idx}
            style={{
              position: "absolute",
              left: `calc(50% + ${val.x}px - 28px)`,
              top: `calc(50% + ${val.y}px - 28px)`
            }}
            animate={{
              y: [0, -6, 0]
            }}
            transition={{
              duration: 3.5 + idx * 0.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="z-25 flex h-14 w-14 flex-col items-center justify-center rounded-2xl bg-white border border-[#1f2528]/8 shadow-[0_8px_20px_rgba(0,0,0,0.04)]"
          >
            <Icon className="h-5 w-5" style={{ color: val.color }} />
            <span className="text-[0.56rem] font-extrabold text-[#627078] uppercase mt-1 tracking-wider">
              {val.label}
            </span>
          </motion.div>
        );
      })}

    </div>
  );
}
