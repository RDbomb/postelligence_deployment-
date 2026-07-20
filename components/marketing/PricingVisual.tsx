"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, ShieldCheck, Zap } from "lucide-react";

export function PricingVisual() {
  const [profilesCount, setProfilesCount] = useState(5);

  const getPlanDetails = (count: number) => {
    if (count <= 2) {
      return { name: "Starter Plan", price: "Free", limit: "2 platforms", featured: false };
    } else if (count <= 8) {
      return { name: "Pro Plan", price: "$19", limit: "Unlimited platforms", featured: true };
    } else {
      return { name: "Team Plan", price: "$49", limit: "Unlimited + 5 workspaces", featured: false };
    }
  };

  const plan = getPlanDetails(profilesCount);

  return (
    <div className="relative mx-auto w-full max-w-[400px] p-6 rounded-3xl border border-[#1f2528]/8 bg-white shadow-[0_20px_50px_rgba(31,37,40,0.05)] relative overflow-hidden flex flex-col gap-6">
      
      {/* Visual Header */}
      <div className="w-full flex items-center justify-between border-b border-[#1f2528]/5 pb-3">
        <span className="text-[0.72rem] text-slate-400 font-bold uppercase tracking-wider">Plan Calculator</span>
        <span className="text-xs text-slate-400 font-bold">Interactive</span>
      </div>

      {/* Slider Control */}
      <div className="flex flex-col gap-2.5 text-left">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-[#1f2528]">Social Accounts Needed</label>
          <span className="text-lg font-extrabold text-[#2f7867]">{profilesCount} profiles</span>
        </div>
        <input
          type="range"
          min="1"
          max="12"
          value={profilesCount}
          onChange={(e) => setProfilesCount(Number(e.target.value))}
          className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#2f7867]"
        />
        <div className="flex items-center justify-between text-[0.68rem] text-slate-400 font-bold uppercase tracking-wider">
          <span>Solo (1-2)</span>
          <span>Professional (3-8)</span>
          <span>Team (9+)</span>
        </div>
      </div>

      {/* Recommended Plan Result Card */}
      <motion.div
        layout
        className={`p-5 rounded-2xl border transition-all text-left ${
          plan.featured 
            ? "border-[#2f7867] bg-[#2f7867]/5 shadow-[0_12px_24px_rgba(47,120,103,0.06)]"
            : "border-slate-100 bg-slate-50/50"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={`text-[0.7rem] font-bold uppercase tracking-wider ${plan.featured ? "text-[#2f7867]" : "text-slate-400"}`}>
            Recommended Tier
          </span>
          {plan.featured && (
            <span className="bg-[#2f7867] text-white text-[0.62rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
              Best Match
            </span>
          )}
        </div>

        <h3 className="text-xl font-extrabold text-[#1f2528] mt-2">{plan.name}</h3>
        
        <div className="mt-4 flex items-baseline gap-1">
          <span className="text-4xl font-extrabold text-[#1f2528]">{plan.price}</span>
          {plan.price !== "Free" && (
            <span className="text-xs text-slate-500 font-bold">/ month</span>
          )}
        </div>

        <ul className="mt-4 space-y-2 border-t border-[#1f2528]/5 pt-3.5">
          <li className="flex items-center gap-2 text-xs text-[#4f5b62]">
            <Check className="h-3.5 w-3.5 text-[#2f7867]" />
            {plan.limit}
          </li>
          <li className="flex items-center gap-2 text-xs text-[#4f5b62]">
            <Check className="h-3.5 w-3.5 text-[#2f7867]" />
            AI Caption Assist included
          </li>
          <li className="flex items-center gap-2 text-xs text-[#4f5b62]">
            <Check className="h-3.5 w-3.5 text-[#2f7867]" />
            Encrypted OAuth secure access
          </li>
        </ul>
      </motion.div>

    </div>
  );
}
