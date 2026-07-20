"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Check, Key, UserCheck, RefreshCw, Smartphone } from "lucide-react";

export function LoginShowcase() {
  return (
    <div className="w-full rounded-[32px] border border-[#2f7867]/12 bg-white/70 backdrop-blur-md p-6 md:p-8 text-[#1f2528] relative overflow-hidden shadow-[0_20px_45px_-12px_rgba(31,37,40,0.05)]">
      
      {/* Soft brand ambient glow */}
      <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#2f7867]/5 blur-[70px] pointer-events-none" />
      <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-[#eaf7ef]/60 blur-[70px] pointer-events-none" />

      {/* Header Title */}
      <div className="relative z-10 text-left">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-[#2f7867]/25 bg-[#eaf7ef] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#2f7867]">
          <ShieldCheck className="h-3.5 w-3.5" />
          Secure Entry Portal
        </div>
        <h2 className="mt-4 text-3xl font-black tracking-[-0.03em] leading-tight md:text-4xl text-[#1f2528]">
          Log in to your
          <br />
          <span className="bg-gradient-to-r from-[#2f7867] to-[#56a98f] bg-clip-text text-transparent">publishing cockpit.</span>
        </h2>
        <p className="mt-3 text-xs leading-relaxed text-slate-500 max-w-sm">
          All platform API connections are verified and encrypted at the database level.
        </p>
      </div>

      {/* Bento Showcase Grid (Light Theme & Login-relevant) */}
      <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
        
        {/* Module 1: Safe Encryption Shield Card (Spans 2 columns) */}
        <div className="sm:col-span-2 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 text-left">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eaf7ef] border border-emerald-200 text-[#2f7867]">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black text-[#1f2528]">OAuth 2.0 Protocol Active</p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                Postelligence communicates directly with social platforms through official APIs. We never store or ask for your social media account passwords.
              </p>
            </div>
          </div>
        </div>

        {/* Module 2: Session Readiness Checks */}
        <div className="rounded-2xl border border-[#1f2528]/6 bg-white/60 p-4 text-left flex flex-col justify-between min-h-[145px]">
          <div>
            <div className="flex items-center gap-1.5 text-[#2f7867] mb-3">
              <RefreshCw className="h-4 w-4 animate-spin-slow" style={{ animationDuration: "12s" }} />
              <span className="text-[10px] font-black uppercase tracking-wider">Session Handshake</span>
            </div>
            
            <div className="space-y-1.5">
              {[
                "Verifying credentials",
                "Decrypting workspace",
                "Syncing active calendars",
              ].map((step, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: idx * 0.4 }}
                    className="h-1.5 w-1.5 rounded-full bg-[#2f7867]"
                  />
                  <span className="text-[10px] font-bold text-slate-600">{step}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-[#1f2528]/5 pt-2 flex items-center justify-between text-[9px] text-slate-400">
            <span>Security handshake</span>
            <span className="font-bold text-[#2f7867]">Active</span>
          </div>
        </div>

        {/* Module 3: Workspace Token Validity */}
        <div className="rounded-2xl border border-[#1f2528]/6 bg-white/60 p-4 text-left flex flex-col justify-between min-h-[145px]">
          <div>
            <div className="flex items-center gap-1.5 text-[#2f7867] mb-3">
              <UserCheck className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-wider">Device Trust</span>
            </div>

            <div className="rounded-xl border border-slate-100 bg-[#fbfbf7] p-2 flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-slate-100 border border-slate-200/60 flex items-center justify-center text-slate-500">
                <Smartphone className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black text-[#1f2528] truncate">Verified Browser</p>
                <p className="text-[8px] font-medium text-slate-400">Fingerprint Matched</p>
              </div>
            </div>
          </div>

          <div className="border-t border-[#1f2528]/5 pt-2 flex items-center justify-between text-[9px] text-slate-400">
            <span>AES-256 tokens</span>
            <span className="font-bold text-[#2f7867]">Encrypted</span>
          </div>
        </div>

      </div>

      {/* Trust checkmarks row */}
      <div className="mt-6 flex flex-wrap justify-between items-center gap-3 border-t border-[#1f2528]/5 pt-5 text-[10px] text-slate-500 font-bold">
        {[
          "Encrypted Sessions",
          "Decoupled Keys",
          "No Password Storage",
        ].map((feat, idx) => (
          <span key={idx} className="flex items-center gap-1">
            <Check className="h-3.5 w-3.5 text-[#2f7867] stroke-[3px]" />
            {feat}
          </span>
        ))}
      </div>

    </div>
  );
}
