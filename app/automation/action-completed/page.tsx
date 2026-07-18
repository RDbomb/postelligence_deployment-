"use client";

import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, AlertCircle, Sparkles, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

function ActionCompletedContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status") || "success";
  const message = searchParams.get("message") || "Action successfully processed.";

  const isSuccess = status === "success";
  const isWarning = status === "warning";

  return (
    <div className="relative min-h-screen bg-gradient-to-tr from-[#d3e3de] via-[#e5ede9] to-[#ebdcd0] flex items-center justify-center p-6 overflow-hidden">
      
      {/* Premium ambient glowing color blobs (highly visible and elegant) */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-[#2f7867]/15 to-[#2f7867]/5 blur-[120px] pointer-events-none animate-pulse duration-[8000ms]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-[#b5a485]/20 to-[#b5a485]/5 blur-[130px] pointer-events-none animate-pulse duration-[6000ms]" />
      
      {/* Concentric scheduler target rings centered behind the card */}
      <div className="absolute flex items-center justify-center pointer-events-none inset-0">
        <div className="w-[380px] h-[380px] rounded-full border-2 border-dashed border-[#2f7867]/10 animate-[spin_80s_linear_infinite]" />
      </div>
      <div className="absolute flex items-center justify-center pointer-events-none inset-0">
        <div className="w-[620px] h-[620px] rounded-full border border-dashed border-[#2f7867]/8 animate-[spin_120s_linear_infinite_reverse]" />
      </div>
      <div className="absolute flex items-center justify-center pointer-events-none inset-0">
        <div className="w-[900px] h-[900px] rounded-full border border-dashed border-[#2f7867]/5" />
      </div>

      {/* Grid texture overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#2f786705_1px,transparent_1px),linear-gradient(to_bottom,#2f786705_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Floating Sparkles for detail */}
      <div className="absolute top-[20%] left-[20%] text-[#2f7867]/25 select-none pointer-events-none animate-bounce duration-[4000ms]">
        <Sparkles className="h-5 w-5" />
      </div>
      <div className="absolute bottom-[20%] right-[20%] text-[#b5a485]/35 select-none pointer-events-none animate-bounce duration-[5000ms]">
        <Sparkles className="h-6 w-6" />
      </div>

      {/* Centered Success Card Container */}
      <div className="relative w-full max-w-md bg-white border border-[#1f2528]/10 rounded-[32px] p-8 sm:p-10 shadow-[0_32px_64px_rgba(31,37,40,0.06),0_12px_24px_rgba(31,37,40,0.02)] text-center space-y-8 backdrop-blur-md bg-white/95">
        
        {/* Top Border Gradient Accent */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#2f7867]/30 via-[#2f7867] to-[#b5a485]/30 rounded-t-[32px]" />

        {/* Small Brand Header */}
        <div className="flex items-center justify-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] pt-1">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#2f7867] animate-pulse" />
          Postelligence Engine
        </div>

        {/* Success Icon Group */}
        <div className="flex justify-center">
          <div className="relative flex items-center justify-center h-22 w-22">
            {/* Outer dotted rings */}
            <div className={`absolute inset-0 rounded-full border-2 border-dashed opacity-25 animate-spin [animation-duration:15s] ${
              isSuccess ? "border-emerald-500" : isWarning ? "border-amber-500" : "border-rose-500"
            }`} />
            
            {/* Soft inner color rings */}
            <div className={`absolute inset-2 rounded-full opacity-40 animate-ping duration-1000 ${
              isSuccess ? "bg-emerald-100" : isWarning ? "bg-amber-100" : "bg-rose-100"
            }`} />
            
            {/* Icon housing */}
            <div className={`relative p-4.5 rounded-full border shadow-[0_4px_12px_rgba(0,0,0,0.02)] ${
              isSuccess 
                ? "bg-emerald-50 border-emerald-100 text-emerald-600" 
                : isWarning 
                  ? "bg-amber-50 border-amber-100 text-amber-600" 
                  : "bg-rose-50 border-rose-100 text-rose-600"
            }`}>
              {isSuccess ? (
                <CheckCircle2 className="h-8 w-8 stroke-[2.2]" />
              ) : isWarning ? (
                <AlertCircle className="h-8 w-8 stroke-[2.2]" />
              ) : (
                <XCircle className="h-8 w-8 stroke-[2.2]" />
              )}
            </div>
          </div>
        </div>

        {/* Status text */}
        <div className="space-y-3">
          <h1 className="text-xl font-black text-[#1f2528] tracking-tight">
            {isSuccess ? "Action Approved" : isWarning ? "Already Processed" : "Action Failed"}
          </h1>
          <p className="text-xs text-slate-500 font-bold leading-relaxed max-w-xs mx-auto px-2">
            {message}
          </p>
        </div>

        {/* Interactive CTA Link */}
        <div className="pt-2">
          <Link
            href="/automation"
            className="group relative flex items-center justify-center w-full px-5 py-4 rounded-2xl bg-gradient-to-r from-[#2f7867] to-[#1e5044] hover:from-[#255f52] hover:to-[#173e35] text-white text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-[0_8px_20px_rgba(47,120,103,0.15)] hover:shadow-[0_12px_24px_rgba(47,120,103,0.25)] hover:-translate-y-0.5"
          >
            <LayoutDashboard className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
            Go to App Dashboard
          </Link>
        </div>

        {/* Brand signature */}
        <div className="flex items-center justify-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] pt-4 border-t border-slate-100">
          <Sparkles className="h-3.5 w-3.5 text-[#2f7867]/60" /> Postelligence Automation
        </div>

      </div>
    </div>
  );
}

export default function ActionCompletedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#fbfcf9] flex items-center justify-center">
        <div className="h-7 w-7 border-2 border-[#2f7867] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ActionCompletedContent />
    </Suspense>
  );
}
