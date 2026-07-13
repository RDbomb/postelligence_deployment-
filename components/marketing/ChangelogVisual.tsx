"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Zap, Check, GitCommit } from "lucide-react";

export function ChangelogVisual() {
  const steps = [
    { version: "v1.2", date: "June 2026", title: "Bluesky & Reddit Nodes", active: true },
    { version: "v1.1", date: "May 2026", title: "AI Voice Calibration", active: false },
    { version: "v1.0", date: "Jan 2026", title: "Public Launch Stable", active: false }
  ];

  return (
    <div className="relative mx-auto w-full max-w-[400px] p-6 rounded-3xl border border-[#1f2528]/8 bg-white shadow-[0_20px_50px_rgba(31,37,40,0.05)] relative overflow-hidden flex flex-col gap-5">
      
      {/* Visual Header */}
      <div className="w-full flex items-center justify-between border-b border-[#1f2528]/5 pb-3">
        <span className="text-[0.72rem] text-slate-400 font-bold uppercase tracking-wider">Release Roadmap</span>
        <span className="text-xs text-[#2f7867] font-bold flex items-center gap-1">
          <Zap className="h-3 w-3 fill-current" />
          Rolling Updates
        </span>
      </div>

      {/* Vertical Animated Release Log */}
      <div className="relative flex flex-col gap-4 text-left before:absolute before:left-[1.25rem] before:top-2 before:bottom-2 before:w-0.5 before:bg-[#2f7867]/10">
        {steps.map((step, idx) => (
          <div key={idx} className="relative flex gap-4">
            {/* Version Badge Dot */}
            <span className={`relative z-[1] flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-white ${
              step.active 
                ? "border-[#2f7867] text-[#2f7867] shadow-[0_4px_10px_rgba(47,120,103,0.14)]" 
                : "border-slate-100 text-slate-300"
            }`}>
              <GitCommit className="h-4.5 w-4.5" />
            </span>

            {/* Content box */}
            <div className={`p-3.5 rounded-xl border flex-1 ${
              step.active 
                ? "border-[#2f7867]/20 bg-[#2f7867]/5" 
                : "border-slate-50 bg-slate-50/20"
            }`}>
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[0.65rem] font-bold uppercase tracking-wider ${
                  step.active ? "text-[#2f7867]" : "text-slate-450 text-slate-400"
                }`}>
                  {step.version} &bull; {step.date}
                </span>
                {step.active && (
                  <span className="text-[0.62rem] font-bold uppercase text-[#20613a] bg-[#eaf7ef] px-2 py-0.5 rounded-full">
                    Latest
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-[#1f2528] mt-1.5">{step.title}</h4>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[0.7rem] text-slate-400 font-bold leading-normal text-center">
        Milestones deploy automatically via CD pipeline hooks.
      </p>

    </div>
  );
}
