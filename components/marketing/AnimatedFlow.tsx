"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, WandSparkles, Send, Shield, Zap, Sparkles } from "lucide-react";

export function AnimatedFlow({ autoPlay = false }: { autoPlay?: boolean }) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [isAligned, setIsAligned] = useState(false);
  const [showShockwave, setShowShockwave] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [complete, setComplete] = useState<Record<string, boolean>>({
    linkedin: false,
    instagram: false,
    youtube: false,
    threads: false,
    bluesky: false,
    twitter: false,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse move listener for 3D parallax tilt
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1; // normalized -1 to 1
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1; // normalized -1 to 1
    setCoords({ x, y });
  };

  const handleMouseLeave = () => {
    setCoords({ x: 0, y: 0 });
  };

  // Tilt calculations
  const tiltX = 60 - coords.y * 18; // Default 60deg tilt forward
  const tiltY = coords.x * 22;      // Tilt left/right by 22deg

  const satellites = [
    { id: "linkedin", label: "LinkedIn", left: "12%", top: "18%", delay: 0.1, color: "#0A66C2", bg: "#e8f1fb", path: <path fill="currentColor" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /> },
    { id: "instagram", label: "Instagram", left: "88%", top: "18%", delay: 0.3, color: "#E1306C", bg: "#fff0ed", path: <path fill="currentColor" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" /> },
    { id: "youtube", label: "YouTube", left: "10%", top: "50%", delay: 0.5, color: "#FF0000", bg: "#fecaca", path: <path fill="currentColor" d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.107C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.388.556a3.003 3.003 0 0 0-2.11 2.107C0 8.053 0 12 0 12s0 3.947.502 5.837a3.003 3.003 0 0 0 2.11 2.107c1.888.556 9.388.556 9.388.556s7.5 0 9.388-.556a3.003 3.003 0 0 0 2.11-2.107C24 15.947 24 12 24 12s0-3.947-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /> },
    { id: "threads", label: "Threads", left: "90%", top: "50%", delay: 0.7, color: "#111827", bg: "#f3f4f6", path: <path fill="currentColor" d="M12.1 22c-5.7 0-9.3-3.7-9.3-9.8C2.8 6.1 6.5 2 12 2c4.2 0 7.4 2.1 8.7 5.7l-3.4 1c-.8-2.3-2.7-3.6-5.2-3.6-3.3 0-5.4 2.7-5.4 7s2.1 6.8 5.5 6.8c2.6 0 4.3-1.3 4.3-3.2 0-1.1-.6-1.9-1.8-2.3-.6 2.2-2.3 3.5-4.6 3.5-2.6 0-4.4-1.6-4.4-3.9 0-2.4 2-4 5.1-4 .6 0 1.2 0 1.8.1-.3-1.2-1.2-1.8-2.6-1.8-1.1 0-2.1.4-3 1.2L5.6 6.2c1.2-1.1 2.8-1.7 4.6-1.7 3.3 0 5.2 1.8 5.6 5.4 2.8.8 4.4 2.8 4.4 5.5 0 4-3.1 6.6-8.1 6.6Zm-1.8-7.8c1.2 0 2-.8 2.3-2.3-.6-.1-1.1-.1-1.7-.1-1.4 0-2.2.5-2.2 1.3 0 .7.6 1.1 1.6 1.1Z" /> },
    { id: "bluesky", label: "Bluesky", left: "12%", top: "82%", delay: 0.9, color: "#1185FE", bg: "#e0f2fe", path: <path fill="currentColor" d="M12 10.8c2 1.5 4.1 4.5 4.8 6.1.7-1.6 2.8-4.6 4.8-6.1 1.5-1.1 3.9-2 3.9.7 0 .5-.3 4.5-.9 5.2-1.1 1.3-4.9 1.2-6.2 1.1 4.5.7 5.7 3 3.2 5.3-4.7 4.3-6.8-1.1-7.3-2.5-.1-.3-.2-.5-.2-.5s-.1.2-.2.5c-.6 1.4-2.7 6.8-7.3 2.5-2.5-2.3-1.3-4.6 3.2-5.3-1.3.1-5.1.2-6.2-1.1C2.3 16 2 12 2 11.5c0-2.7 2.4-1.8 3.9-.7z" /> },
    { id: "twitter", label: "X", left: "88%", top: "82%", delay: 1.1, color: "#0f1419", bg: "#f3f4f6", path: <path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /> }
  ];

  const handlePublish = () => {
    if (isPublishing) return;
    setIsPublishing(true);
    setIsAligned(false);
    setComplete({ linkedin: false, instagram: false, youtube: false, threads: false, bluesky: false, twitter: false });

    // 1. Vault cylinder starts spinning aggressively
    // 2. Align mechanism at 1.4 seconds
    setTimeout(() => {
      setIsAligned(true);
      setShowShockwave(true);
    }, 1400);

    // 3. Staggered activation of satellites as laser beam triggers them
    setTimeout(() => setComplete((prev) => ({ ...prev, linkedin: true })), 1650);
    setTimeout(() => setComplete((prev) => ({ ...prev, instagram: true })), 1850);
    setTimeout(() => setComplete((prev) => ({ ...prev, youtube: true })), 2050);
    setTimeout(() => setComplete((prev) => ({ ...prev, threads: true })), 2250);
    setTimeout(() => setComplete((prev) => ({ ...prev, bluesky: true })), 2450);
    setTimeout(() => setComplete((prev) => ({ ...prev, twitter: true })), 2650);

    // Reset sequence
    setTimeout(() => {
      setShowShockwave(false);
      setIsPublishing(false);
      setIsAligned(false);
    }, 4200);
  };

  useEffect(() => {
    if (!autoPlay) return;

    let isMounted = true;
    const runSequence = async () => {
      while (isMounted) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        if (!isMounted) break;

        setIsPublishing(true);
        setIsAligned(false);
        setComplete({ linkedin: false, instagram: false, youtube: false, threads: false, bluesky: false, twitter: false });

        await new Promise((resolve) => setTimeout(resolve, 1400));
        if (!isMounted) break;
        setIsAligned(true);
        setShowShockwave(true);

        await new Promise((resolve) => setTimeout(resolve, 250));
        if (!isMounted) break;
        setComplete((prev) => ({ ...prev, linkedin: true }));

        await new Promise((resolve) => setTimeout(resolve, 200));
        if (!isMounted) break;
        setComplete((prev) => ({ ...prev, instagram: true }));

        await new Promise((resolve) => setTimeout(resolve, 200));
        if (!isMounted) break;
        setComplete((prev) => ({ ...prev, youtube: true }));

        await new Promise((resolve) => setTimeout(resolve, 200));
        if (!isMounted) break;
        setComplete((prev) => ({ ...prev, threads: true }));

        await new Promise((resolve) => setTimeout(resolve, 200));
        if (!isMounted) break;
        setComplete((prev) => ({ ...prev, bluesky: true }));

        await new Promise((resolve) => setTimeout(resolve, 200));
        if (!isMounted) break;
        setComplete((prev) => ({ ...prev, twitter: true }));

        await new Promise((resolve) => setTimeout(resolve, 1000));
        if (!isMounted) break;
        setShowShockwave(false);
        setIsPublishing(false);
        setIsAligned(false);

        await new Promise((resolve) => setTimeout(resolve, 4000));
        if (!isMounted) break;
        setComplete({ linkedin: false, instagram: false, youtube: false, threads: false, bluesky: false, twitter: false });
      }
    };

    runSequence();
    return () => {
      isMounted = false;
    };
  }, [autoPlay]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="w-full max-w-[500px] h-[360px] relative mx-auto select-none rounded-[32px] border border-[#2f7867]/15 bg-gradient-to-b from-white/95 to-slate-50/80 p-6 shadow-[0_24px_50px_-12px_rgba(31,37,40,0.08)] backdrop-blur-md overflow-hidden"
      style={{ perspective: "1200px" }}
    >
      
      {/* Dynamic ambient radial gradients */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_50%,_var(--tw-gradient-stops))] from-[#eaf7ef]/70 via-transparent to-transparent opacity-80" />

      {/* ── 3D PARALLAX CONTAINER ── */}
      <motion.div
        animate={{
          rotateX: tiltX,
          rotateY: tiltY,
        }}
        transition={{ type: "spring", stiffness: 100, damping: 20, mass: 0.5 }}
        className="w-full h-full relative"
        style={{ transformStyle: "preserve-3d" }}
      >

        {/* ── EXPANDING SHOCKWAVE RIPPLE ── */}
        <AnimatePresence>
          {showShockwave && (
            <motion.div
              initial={{ width: 0, height: 0, opacity: 1 }}
              animate={{ width: 380, height: 380, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-[#2f7867]/40 pointer-events-none z-10"
              style={{ transform: "translateZ(0px)" }}
            />
          )}
        </AnimatePresence>

        {/* ── 3D VAULT CYLINDER LOCK (Center) ── */}
        <div 
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center cursor-pointer"
          onClick={handlePublish}
          style={{ transformStyle: "preserve-3d", transform: "translate3d(-50%, -50%, 40px)" }}
        >
          {/* Vertical Neon Brand Core */}
          <div 
            className={`w-4.5 h-36 rounded-full transition-all duration-700 absolute ${
              isAligned 
                ? "bg-[#2f7867] shadow-[0_0_35px_#2f7867,0_0_15px_#2f7867]" 
                : "bg-cyan-500/80 shadow-[0_0_20px_rgba(6,182,212,0.5)]"
            }`}
            style={{ transform: "translateZ(0px)" }}
          />

          {/* Three Stacked Frosted Glass Rings */}
          {[
            { id: "top", z: -40, speed: -12, alignAngle: 0 },
            { id: "mid", z: 0, speed: 18, alignAngle: 180 },
            { id: "bot", z: 40, speed: -8, alignAngle: 90 },
          ].map((ring) => {
            // Rotation configuration based on state
            const animationValue = isPublishing
              ? isAligned
                ? { rotateZ: ring.alignAngle } // Snapped in perfect alignment
                : { rotateZ: ring.speed > 0 ? [0, 720] : [0, -720] } // Fast spins
              : { rotateZ: ring.speed > 0 ? [0, 360] : [0, -360] }; // Slow idle spin

            const transitionValue = isPublishing
              ? isAligned
                ? { duration: 0.35, ease: "easeOut" as const }
                : { repeat: Infinity, duration: 1.1, ease: "linear" as const }
              : { repeat: Infinity, duration: Math.abs(ring.speed), ease: "linear" as const };

            return (
              <motion.div
                key={ring.id}
                animate={animationValue}
                transition={transitionValue}
                className="absolute w-28 h-28 rounded-full border border-white/50 bg-white/10 backdrop-blur-[2px] shadow-[inset_0_0_12px_rgba(255,255,255,0.4),0_8px_16px_rgba(0,0,0,0.04)] flex items-center justify-center"
                style={{
                  transformStyle: "preserve-3d",
                  transform: `rotateX(90deg) translateZ(${ring.z}px)`,
                }}
              >
                {/* Cylinder Notch Marks */}
                {Array.from({ length: 8 }).map((_, i) => {
                  const angle = (i * 360) / 8;
                  const isMatch = isAligned && angle === ring.alignAngle;
                  return (
                    <div
                      key={i}
                      className={`absolute w-1 h-2 rounded-full transition-all duration-300 ${
                        isMatch ? "bg-[#2f7867] scale-y-150" : "bg-white/40"
                      }`}
                      style={{
                        transform: `rotate(${angle}deg) translateY(-54px)`,
                      }}
                    />
                  );
                })}
              </motion.div>
            );
          })}
        </div>

        {/* ── SATELLITE PLATFORM CARDS ── */}
        {satellites.map((sat) => {
          const isDone = complete[sat.id];
          return (
            <div
              key={sat.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-30"
              style={{
                left: sat.left,
                top: sat.top,
                transformStyle: "preserve-3d",
              }}
            >
              {/* Dynamic 3D depth shift and Y-axis flip when connected */}
              <motion.div
                animate={
                  isDone
                    ? { rotateY: 180, scale: 1.05, translateZ: 60, boxShadow: "0px 12px 30px rgba(47, 120, 103, 0.25)" }
                    : isPublishing && !isDone
                    ? { rotateY: [0, 8, -8, 0], translateZ: 15 }
                    : { rotateY: 0, scale: 1, translateZ: 20 }
                }
                transition={{
                  default: { type: "spring", stiffness: 100, damping: 15 },
                  rotateY: { type: "keyframes", duration: 0.6, ease: "easeInOut" }
                }}
                className={`w-14 h-14 rounded-2xl bg-white border border-slate-200/50 shadow-[0_4px_16px_rgba(0,0,0,0.03)] cursor-pointer relative ${
                  isDone ? "border-[#2f7867]/30" : "hover:border-slate-300"
                }`}
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Front Side: platform icon (dimmed/grayed by default) */}
                <div 
                  className="absolute inset-0 flex items-center justify-center rounded-2xl backface-hidden"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 text-slate-400 opacity-60 group-hover:opacity-100 group-hover:scale-105"
                    style={{ color: sat.color }}
                  >
                    <svg className="h-5.5 w-5.5" viewBox="0 0 24 24">
                      {sat.path}
                    </svg>
                  </div>
                </div>

                {/* Back Side: verified connected state layout (reveals after 3D flip) */}
                <div 
                  className="absolute inset-0 flex flex-col justify-between p-1.5 rounded-2xl bg-white backface-hidden"
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                  <div className="flex items-center justify-between border-b border-slate-50 pb-0.5">
                    <span className="text-[6px] font-black uppercase tracking-wider" style={{ color: sat.color }}>{sat.label}</span>
                    <Check className="h-2.5 w-2.5 text-emerald-600 stroke-[3.5px]" />
                  </div>
                  {/* Miniature post layout preview inside satellite */}
                  <div 
                    className="h-4.5 rounded bg-slate-50 border border-slate-100 flex items-center justify-center"
                    style={{ backgroundColor: sat.bg }}
                  >
                    <span className="text-[4px] font-black tracking-wider" style={{ color: sat.color }}>SYNCED</span>
                  </div>
                  <div className="space-y-0.5">
                    <div className="h-0.8 rounded-full bg-slate-100 w-10/12" />
                    <div className="h-0.8 rounded-full bg-slate-100 w-7/12" />
                  </div>
                </div>

              </motion.div>
            </div>
          );
        })}

      </motion.div>

      {/* Floating Sparkles for ambient depth aura */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {[
          { left: "15%", top: "45%" },
          { left: "85%", top: "40%" },
          { left: "50%", top: "85%" },
        ].map((spark, idx) => (
          <motion.div
            key={idx}
            animate={{
              y: [0, -10, 0],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 3 + idx,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute"
            style={{ left: spark.left, top: spark.top }}
          >
            <Sparkles className="h-4.5 w-4.5 text-[#2f7867]/20" />
          </motion.div>
        ))}
      </div>

      {/* Subtitle / guidance note at the bottom */}
      <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none z-40">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2f7867]/10 bg-white/90 px-3 py-1 text-[10px] font-bold text-slate-500 shadow-sm backdrop-blur-sm">
          <Shield className="h-3.5 w-3.5 text-[#2f7867] animate-pulse" />
          Tap Vault Core to trigger synchronization sequence
        </span>
      </div>
    </div>
  );
}
