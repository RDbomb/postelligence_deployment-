"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PenLine, Sparkles, Check, Image as ImageIcon, Send } from "lucide-react";

export function FeaturesVisual() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStage((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-[400px] p-6 rounded-3xl border border-[#1f2528]/8 bg-white shadow-[0_20px_50px_rgba(31,37,40,0.05)] relative overflow-hidden flex flex-col gap-4">
      {/* Mimic Window Controls */}
      <div className="flex items-center gap-1.5 border-b border-[#1f2528]/5 pb-3">
        <span className="h-3 w-3 rounded-full bg-red-400" />
        <span className="h-3 w-3 rounded-full bg-yellow-400" />
        <span className="h-3 w-3 rounded-full bg-green-400" />
        <span className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider ml-auto">Composer Studio</span>
      </div>

      {/* Post Text Input Box */}
      <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col gap-3 min-h-[140px] justify-between">
        <div className="flex items-start gap-3">
          <div className="h-7 w-7 rounded-lg bg-[#2f7867]/10 flex items-center justify-center text-[#2f7867]">
            <PenLine className="h-3.5 w-3.5" />
          </div>
          <div className="flex-1 text-left">
            <span className="text-[0.68rem] text-slate-400 font-bold uppercase tracking-wider block">Input Draft</span>
            <div className="text-sm font-semibold text-[#1f2528] mt-1.5 min-h-[40px]">
              <AnimatePresence mode="wait">
                {stage === 0 && (
                  <motion.p
                    key="stage-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    Just completed the layout refactoring on the website. Warm colors are in! 🎨
                  </motion.p>
                )}
                {stage === 1 && (
                  <motion.p
                    key="stage-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    Excited to deploy our updated interactive content features today. Let us know what you think! 🚀
                  </motion.p>
                )}
                {stage === 2 && (
                  <motion.p
                    key="stage-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    Simplifying work for creators is what we live for. Postelligence dashboard is ready. ✨
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[#1f2528]/5 pt-3">
          <div className="flex gap-2 text-slate-400">
            <ImageIcon className="h-3.5 w-3.5" />
            <Sparkles className="h-3.5 w-3.5 text-[#2f7867]" />
          </div>
          <span className="text-[0.7rem] text-slate-400 font-bold">Wordcount: 14</span>
        </div>
      </div>

      {/* Floating Status Checklists */}
      <div className="flex flex-col gap-2">
        {[
          { label: "AI Brand Tone Calibration", activeStage: 0 },
          { label: "Optimal Schedule Analysis", activeStage: 1 },
          { label: "Cross-Platform Formatting", activeStage: 2 }
        ].map((item, idx) => {
          const isActive = stage === item.activeStage;
          return (
            <motion.div
              key={idx}
              animate={{
                borderColor: isActive ? "rgba(47, 120, 103, 0.2)" : "rgba(31, 37, 40, 0.06)",
                backgroundColor: isActive ? "#eaf7ef" : "#ffffff"
              }}
              className="p-3 rounded-xl border flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${isActive ? "bg-[#2f7867] animate-ping" : "bg-slate-300"}`} />
                <span className={`text-[0.78rem] font-bold ${isActive ? "text-[#2f7867]" : "text-[#627078]"}`}>
                  {item.label}
                </span>
              </div>
              {isActive ? (
                <Check className="h-3.5 w-3.5 text-[#20613a]" />
              ) : (
                <span className="text-[0.65rem] font-bold text-slate-300 uppercase">Pending</span>
              )}
            </motion.div>
          );
        })}
      </div>

    </div>
  );
}
