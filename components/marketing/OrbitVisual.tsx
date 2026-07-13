"use client";

import { motion } from "framer-motion";

const platforms = [
  { label: "LinkedIn", color: "#1d5b95", bg: "#e8f1fb", angle: -90 },
  { label: "Instagram", color: "#a53b28", bg: "#fff0ed", angle: -30 },
  { label: "YouTube", color: "#7a5a00", bg: "#fff5d7", angle: 30 },
  { label: "Threads", color: "#1f2528", bg: "#eceeec", angle: 90 },
  { label: "Bluesky", color: "#1d6fa5", bg: "#e7f3fb", angle: 150 },
  { label: "Pinterest", color: "#9c2348", bg: "#fbe9ee", angle: 210 }
];

export function OrbitVisual() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[420px]" aria-hidden="true">
      <svg viewBox="0 0 420 420" className="absolute inset-0 h-full w-full">
        <circle
          cx="210"
          cy="210"
          r="168"
          fill="none"
          stroke="rgba(31,37,40,0.08)"
          strokeWidth="1"
          strokeDasharray="2 8"
        />
        <circle cx="210" cy="210" r="118" fill="none" stroke="rgba(31,37,40,0.07)" strokeWidth="1" />
      </svg>

      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      >
        {platforms.map((p) => {
          const rad = (p.angle * Math.PI) / 180;
          const r = 168;
          const x = 210 + r * Math.cos(rad);
          const y = 210 + r * Math.sin(rad);
          return (
            <motion.div
              key={p.label}
              className="absolute flex cursor-default items-center justify-center rounded-2xl shadow-[0_8px_24px_rgba(31,37,40,0.10)]"
              style={{
                left: `${(x / 420) * 100}%`,
                top: `${(y / 420) * 100}%`,
                width: 92,
                height: 40,
                marginLeft: -46,
                marginTop: -20,
                background: p.bg
              }}
              animate={{ rotate: -360 }}
              whileHover={{ scale: 1.12, transition: { duration: 0.2 } }}
              transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            >
              <span className="text-[0.78rem] font-bold" style={{ color: p.color }}>
                {p.label}
              </span>
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div
        className="absolute left-1/2 top-1/2 flex h-[124px] w-[124px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-1 rounded-[28px] border border-[#1f2528]/10 bg-white text-center shadow-[0_24px_60px_rgba(31,37,40,0.16)]"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1f2528]">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
            <path
              d="M5 12h14M13 6l6 6-6 6"
              stroke="#f6f7f1"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className="text-[0.72rem] font-bold uppercase tracking-[0.06em] text-[#5a656c]">
          One draft
        </span>
      </motion.div>

      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute h-1.5 w-1.5 rounded-full bg-[#2f7867]/50"
          style={{ left: `${30 + i * 22}%`, top: `${18 + i * 8}%` }}
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.3, 0.8] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.6, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
