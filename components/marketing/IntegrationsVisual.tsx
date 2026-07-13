"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link2, Check, RefreshCw } from "lucide-react";

export function IntegrationsVisual() {
  const [activePlatform, setActivePlatform] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActivePlatform((prev) => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const items = [
    { name: "LinkedIn", color: "#1d5b95", bg: "#e8f1fb", desc: "Native API" },
    { name: "Instagram", color: "#a53b28", bg: "#fff0ed", desc: "Meta Graph" },
    { name: "YouTube", color: "#7a5a00", bg: "#fff5d7", desc: "OAuth Client" },
    { name: "Threads", color: "#1f2528", bg: "#eceeec", desc: "Threads API" }
  ];

  return (
    <div className="relative mx-auto w-full max-w-[400px] p-6 rounded-3xl border border-[#1f2528]/8 bg-white shadow-[0_20px_50px_rgba(31,37,40,0.05)] relative overflow-hidden flex flex-col gap-6 items-center">
      
      {/* Visual Header */}
      <div className="w-full flex items-center justify-between border-b border-[#1f2528]/5 pb-3">
        <span className="text-[0.72rem] text-slate-400 font-bold uppercase tracking-wider">OAuth Connections</span>
        <div className="flex items-center gap-1.5 text-xs text-[#2f7867] font-bold">
          <RefreshCw className="h-3 w-3 animate-spin" />
          Active
        </div>
      </div>

      {/* Grid of Connections */}
      <div className="grid grid-cols-2 gap-4 w-full">
        {items.map((item, idx) => {
          const isActive = idx === activePlatform;
          return (
            <motion.div
              key={item.name}
              animate={{
                scale: isActive ? 1.02 : 1,
                borderColor: isActive ? "rgba(47, 120, 103, 0.2)" : "rgba(31, 37, 40, 0.06)",
                boxShadow: isActive ? "0 10px 25px rgba(47,120,103,0.08)" : "none"
              }}
              className="p-4 rounded-2xl border bg-white flex flex-col gap-3 relative transition-all"
            >
              <div className="flex items-center justify-between">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-xs font-black"
                  style={{ background: item.bg, color: item.color }}
                >
                  {item.name.slice(0, 2).toUpperCase()}
                </div>
                {isActive ? (
                  <motion.div
                    animate={{ scale: [0.8, 1.2, 1] }}
                    className="h-5 w-5 rounded-full bg-[#eaf7ef] border border-[#bfe2c9] flex items-center justify-center text-[#20613a]"
                  >
                    <Check className="h-3 w-3" />
                  </motion.div>
                ) : (
                  <span className="text-[0.62rem] font-bold text-slate-400 uppercase">Connected</span>
                )}
              </div>

              <div className="text-left mt-2">
                <h3 className="text-sm font-semibold text-[#1f2528]">{item.name}</h3>
                <span className="text-[0.68rem] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">
                  {item.desc}
                </span>
              </div>

              {/* Pulse Indicator */}
              {isActive && (
                <div className="absolute -inset-px border border-[#2f7867] rounded-2xl animate-pulse pointer-events-none opacity-40" />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Decorative text */}
      <p className="text-[0.74rem] text-slate-400 font-bold leading-relaxed text-center">
        Secure handshake tokens refresh automatically in background.
      </p>

    </div>
  );
}
