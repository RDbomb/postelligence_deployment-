"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, PenLine, Zap, Check, FileText, Share2 } from "lucide-react";

/* ── Custom Platform SVGs to avoid old Lucide version missing exports ── */
function LinkedinIcon({ size = 16, color = "currentColor", className, style }: { size?: number; color?: string; className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={color} className={className} style={style}>
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
    </svg>
  );
}

function InstagramIcon({ size = 16, color = "currentColor", className, style }: { size?: number; color?: string; className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function ThreadsIcon({ size = 16, color = "currentColor", className, style }: { size?: number; color?: string; className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={color} className={className} style={style}>
      <path d="M13.748 10.907c-.193-.09-.39-.175-.593-.253C12.927 8.936 11.795 7.83 9.913 7.804h-.064c-1.16 0-2.128.497-2.72 1.4L8.25 10.1c.444-.673 1.14-.82 1.655-.82h.05c.64.004 1.122.19 1.435.553.227.264.38.629.454 1.09a11.36 11.36 0 0 0-1.837-.088c-1.847.106-3.035 1.183-2.952 2.679.04.759.42 1.412 1.065 1.839.547.361 1.25.537 1.98.496.966-.053 1.724-.421 2.252-1.095.402-.512.656-1.175.767-2.012.46.278.801.643.99 1.084.321.747.34 1.974-.663 2.977-.877.877-1.93 1.256-3.523 1.267-1.768-.013-3.104-.582-3.97-1.69-.806-1.034-1.215-2.497-1.22-4.355.005-1.857.414-3.32 1.22-4.353.866-1.108 2.202-1.677 3.97-1.69 1.78.014 3.14.587 4.044 1.704.446.553.782 1.258.994 2.093l1.15-.312c-.26-1.037-.683-1.921-1.272-2.64C12.413 5.695 10.743 4.98 8.66 4.965h-.011C6.568 4.98 4.88 5.703 3.816 7.09 2.867 8.327 2.38 10.08 2.375 12c.005 1.92.492 3.673 1.44 4.91C4.88 18.297 6.568 19.02 8.65 19.035h.01c1.868-.013 3.186-.5 4.27-1.581 1.403-1.4 1.364-3.163.908-4.24-.322-.75-.939-1.358-1.838-1.79l-.002-.002a.006.006 0 0 0-.002-.001l.004.002-.252-.516zm-2.895 3.157c-.806.045-1.644-.316-1.68-.93-.026-.427.3-.907 1.259-.964.15-.009.297-.013.44-.013.458 0 .891.044 1.287.126-.154 1.91-1.165 2.74-1.948 2.781H10.853z" />
    </svg>
  );
}

const steps = [
  {
    id: 0,
    title: "1. Write Once",
    subtitle: "Unified Composer",
    desc: "Draft your message in a clean, distraction-free environment. Add images, links, or videos.",
    icon: PenLine,
  },
  {
    id: 1,
    title: "2. AI Adapts",
    subtitle: "Tone & Format Tuning",
    desc: "AI reshapes tone, character limits, formatting, and hashtags for each platform automatically.",
    icon: Sparkles,
  },
  {
    id: 2,
    title: "3. Publish & Sync",
    subtitle: "Auto-Refresh Handshake",
    desc: "Review your tailored drafts and schedule them to publish natively through secure APIs.",
    icon: Zap,
  },
];

const platformPreviews = {
  linkedin: {
    name: "LinkedIn Preview",
    icon: LinkedinIcon,
    color: "#0077B5",
    bg: "#e8f1fb",
    text: "I'm excited to share that Postelligence is officially launching today! 🚀\n\nWe set out to build a calmer, more intuitive workspace to help creators eliminate manual reformatting and preserve their brand voice. No scraping, no middlemen, just direct native API publishing.\n\nHere is how we do it differently...",
    tagline: "Professional • Tailored for Reach",
  },
  threads: {
    name: "Threads Preview",
    icon: ThreadsIcon,
    color: "#1f2528",
    bg: "#eceeec",
    text: "Postelligence is officially live! 🚀\n\nOne composer, absolute focus:\n• Tailored AI formatting per platform\n• Secure OAuth platform APIs\n• Visual drag-and-drop calendar\n\nNo duplicate work. Try it at postelligence.com",
    tagline: "Conversational • Short Bullets",
  },
  instagram: {
    name: "Instagram Preview",
    icon: InstagramIcon,
    color: "#d6249f",
    bg: "#fff0ed",
    text: "Tailored brand voice, unified workflows, and absolute focus. Postelligence is officially live today. 🚀 \n\nStop copying and pasting. Connect once, publish everywhere.\n\n#creators #socialmedia #marketingtips #saas #productivity",
    tagline: "Visual Caption • Hashtags",
  },
};

export function ProductFlowDemo() {
  const [activeStep, setActiveStep] = useState(0);
  const [activePlat, setActivePlat] = useState<"linkedin" | "threads" | "instagram">("linkedin");
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "done">("idle");

  const handleSyncSim = () => {
    setSyncStatus("syncing");
    setTimeout(() => {
      setSyncStatus("done");
    }, 2000);
  };

  return (
    <div className="mx-auto max-w-5xl rounded-3xl border border-[#1f2528]/8 bg-white/70 p-6 backdrop-blur-xl shadow-[0_24px_60px_rgba(31,37,40,0.05)] grid gap-8 lg:grid-cols-[1.1fr_1.9fr] items-center relative overflow-hidden">
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#2f7867]/5 to-transparent rounded-bl-full pointer-events-none" />

      {/* Left: Steps Selection */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[0.68rem] font-bold uppercase tracking-wider text-[#2f7867] text-left">Interactive Guide</span>
          <h3 className="text-xl font-bold tracking-tight text-[#1f2528] text-left">Tailored multi-platform flow</h3>
        </div>

        <div className="flex flex-col gap-3 mt-4">
          {steps.map((step) => {
            const isActive = activeStep === step.id;
            const Icon = step.icon;
            return (
              <button
                key={step.id}
                onClick={() => {
                  setActiveStep(step.id);
                  if (step.id !== 2) setSyncStatus("idle");
                }}
                className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 flex items-start gap-4 cursor-pointer ${
                  isActive
                    ? "bg-white border-[#2f7867]/25 shadow-sm"
                    : "bg-transparent border-transparent hover:bg-white/40"
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                    isActive ? "bg-[#2f7867] text-white" : "bg-[#1f2528]/5 text-[#627078]"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-[#8a949a] uppercase tracking-wider">{step.title}</span>
                  <span className={`block font-bold mt-0.5 ${isActive ? "text-[#1f2528]" : "text-[#627078]"}`}>
                    {step.subtitle}
                  </span>
                  <p className="text-xs text-[#7b858d] mt-1.5 leading-relaxed">{step.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: Interactive Simulator Screen */}
      <div className="rounded-2xl border border-[#1f2528]/8 bg-white/90 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.02)] min-h-[350px] flex flex-col justify-between relative overflow-hidden">
        
        <AnimatePresence mode="wait">
          {/* STEP 1: COMPOSER MOCKUP */}
          {activeStep === 0 && (
            <motion.div
              key="step-composer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-4 h-full"
            >
              <div className="flex items-center justify-between border-b border-[#1f2528]/5 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#2f7867]" />
                  <span className="text-xs font-bold text-[#1f2528]">Draft composer</span>
                </div>
                <span className="text-[0.62rem] px-2 py-0.5 rounded bg-[#f6f7f1] border border-[#1f2528]/5 text-[#627078] font-bold">Unsaved Draft</span>
              </div>

              <div className="flex-1 min-h-[140px] border border-[#1f2528]/8 bg-[#fbfbf9]/60 rounded-xl p-4 text-sm text-[#1f2528] leading-relaxed font-medium text-left">
                Postelligence is launching today! 🚀 We built a calmer, more intuitive workspace to help creators eliminate manual reformatting. Write once, publish everywhere tailored to each platform.
              </div>

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#1f2528]/5">
                <div className="flex gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#1d5b95]" />
                  <span className="h-2 w-2 rounded-full bg-[#d6249f]" />
                  <span className="h-2 w-2 rounded-full bg-[#1f2528]" />
                </div>
                <button
                  onClick={() => setActiveStep(1)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#1f2528] hover:bg-[#2f7867] px-4.5 py-2 text-xs font-bold text-white shadow-sm transition-colors cursor-pointer"
                >
                  Optimize with AI
                  <Sparkles className="h-3 w-3" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: AI OPTIMIZER PREVIEW */}
          {activeStep === 1 && (
            <motion.div
              key="step-optimizer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-4 h-full"
            >
              <div className="flex items-center justify-between border-b border-[#1f2528]/5 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#6d5ad0]" />
                  <span className="text-xs font-bold text-[#1f2528]">AI Multichannel Optimization</span>
                </div>
              </div>

              {/* Platform Switcher Tabs */}
              <div className="flex gap-1.5 p-1 rounded-xl bg-[#f6f7f1] border border-[#1f2528]/5">
                {(["linkedin", "threads", "instagram"] as const).map((plat) => {
                  const platData = platformPreviews[plat];
                  const PlatIcon = platData.icon;
                  const isActive = activePlat === plat;
                  return (
                    <button
                      key={plat}
                      onClick={() => setActivePlat(plat)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? "bg-white shadow-sm text-[#1f2528] border border-[#1f2528]/5"
                          : "text-[#627078] hover:text-[#1f2528]"
                      }`}
                    >
                      <PlatIcon className="h-3.5 w-3.5" style={{ color: isActive ? platData.color : undefined }} />
                      {plat.charAt(0).toUpperCase() + plat.slice(1)}
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Optimized Content */}
              <div className="flex-1 min-h-[140px] border border-[#1f2528]/8 bg-[#fbfbf9]/60 rounded-xl p-4 flex flex-col justify-between text-left">
                <p className="text-xs text-[#627078] whitespace-pre-line leading-relaxed font-medium">
                  {platformPreviews[activePlat].text}
                </p>
                <div className="mt-4 pt-2 border-t border-[#1f2528]/5 flex items-center justify-between text-[0.68rem]">
                  <span className="font-semibold" style={{ color: platformPreviews[activePlat].color }}>
                    {platformPreviews[activePlat].tagline}
                  </span>
                  <span className="text-[#8a949a]">Status: Auto-Adapted</span>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-[#1f2528]/5">
                <button
                  onClick={() => setActiveStep(2)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#1f2528] hover:bg-[#2f7867] px-4.5 py-2 text-xs font-bold text-white shadow-sm transition-colors cursor-pointer"
                >
                  Proceed to Schedule
                  <Zap className="h-3 w-3" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: PUBLISH & SYNC SIMULATOR */}
          {activeStep === 2 && (
            <motion.div
              key="step-sync"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-4 h-full"
            >
              <div className="flex items-center justify-between border-b border-[#1f2528]/5 pb-3">
                <div className="flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-[#d05945]" />
                  <span className="text-xs font-bold text-[#1f2528]">Direct OAuth Publish Queue</span>
                </div>
              </div>

              {/* Status List */}
              <div className="flex-1 flex flex-col gap-2 min-h-[140px]">
                {(["linkedin", "threads", "instagram"] as const).map((plat) => {
                  const platData = platformPreviews[plat];
                  const PlatIcon = platData.icon;
                  return (
                    <div
                      key={plat}
                      className="flex items-center justify-between p-3 rounded-xl border border-[#1f2528]/5 bg-[#fbfbf9]/60"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-lg shadow-sm"
                          style={{ background: platData.bg }}
                        >
                          <PlatIcon className="h-4 w-4" style={{ color: platData.color }} />
                        </div>
                        <span className="text-xs font-bold text-[#1f2528]">{platData.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {syncStatus === "done" ? (
                          <span className="inline-flex items-center gap-1 text-[0.62rem] font-bold text-[#20613a] bg-[#eaf7ef] border border-[#bfe2c9] px-2 py-0.5 rounded-full">
                            <Check className="h-2.5 w-2.5" />
                            Published
                          </span>
                        ) : syncStatus === "syncing" ? (
                          <span className="text-[0.62rem] text-[#2f7867] font-bold animate-pulse">Syncing...</span>
                        ) : (
                          <span className="text-[0.62rem] text-slate-400 font-bold">Ready</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#1f2528]/5 mt-2">
                <button
                  onClick={() => {
                    setActiveStep(0);
                    setSyncStatus("idle");
                  }}
                  className="text-xs font-bold text-[#627078] hover:text-[#1f2528] cursor-pointer"
                >
                  Start over
                </button>
                <button
                  onClick={handleSyncSim}
                  disabled={syncStatus === "syncing"}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#2f7867] hover:bg-[#1f2528] px-4.5 py-2 text-xs font-bold text-white shadow-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {syncStatus === "done" ? "Sync Complete!" : syncStatus === "syncing" ? "Syncing..." : "Sync Platforms"}
                  {syncStatus === "done" && <Check className="h-3 w-3" />}
                  {syncStatus === "idle" && <Zap className="h-3 w-3" />}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}