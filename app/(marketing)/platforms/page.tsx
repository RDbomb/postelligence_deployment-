"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ArrowRight, Check, Zap, Shield, RefreshCw, Globe } from "lucide-react";
import { PageTransition } from "@/components/marketing/PageTransition";
import { Reveal } from "@/components/marketing/Reveal";

/* ── Brand SVG Icons ───────────────────────────────────────────────────────── */
function LinkedInIcon({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="#0077B5">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
    </svg>
  );
}

function InstagramIcon({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="url(#ig-page-grad)">
      <defs>
        <radialGradient id="ig-page-grad" cx="30%" cy="107%" r="130%">
          <stop offset="0%" stopColor="#fdf497" />
          <stop offset="45%" stopColor="#fd5949" />
          <stop offset="60%" stopColor="#d6249f" />
          <stop offset="90%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845a1.21 1.21 0 1 0 .001 2.42 1.21 1.21 0 0 0-.001-2.42z" />
    </svg>
  );
}

function YouTubeIcon({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="#FF0000">
      <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.508 9.388.508 9.388.508s7.518 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function ThreadsIcon({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="#000">
      <path d="M13.748 10.907c-.193-.09-.39-.175-.593-.253C12.927 8.936 11.795 7.83 9.913 7.804h-.064c-1.16 0-2.128.497-2.72 1.4L8.25 10.1c.444-.673 1.14-.82 1.655-.82h.05c.64.004 1.122.19 1.435.553.227.264.38.629.454 1.09a11.36 11.36 0 0 0-1.837-.088c-1.847.106-3.035 1.183-2.952 2.679.04.759.42 1.412 1.065 1.839.547.361 1.25.537 1.98.496.966-.053 1.724-.421 2.252-1.095.402-.512.656-1.175.767-2.012.46.278.801.643.99 1.084.321.747.34 1.974-.663 2.977-.877.877-1.93 1.256-3.523 1.267-1.768-.013-3.104-.582-3.97-1.69-.806-1.034-1.215-2.497-1.22-4.355.005-1.857.414-3.32 1.22-4.353.866-1.108 2.202-1.677 3.97-1.69 1.78.014 3.14.587 4.044 1.704.446.553.782 1.258.994 2.093l1.15-.312c-.26-1.037-.683-1.921-1.272-2.64C12.413 5.695 10.743 4.98 8.66 4.965h-.011C6.568 4.98 4.88 5.703 3.816 7.09 2.867 8.327 2.38 10.08 2.375 12c.005 1.92.492 3.673 1.44 4.91C4.88 18.297 6.568 19.02 8.65 19.035h.01c1.868-.013 3.186-.5 4.27-1.581 1.403-1.4 1.364-3.163.908-4.24-.322-.75-.939-1.358-1.838-1.79l-.002-.002a.006.006 0 0 0-.002-.001l.004.002-.252-.516zm-2.895 3.157c-.806.045-1.644-.316-1.68-.93-.026-.427.3-.907 1.259-.964.15-.009.297-.013.44-.013.458 0 .891.044 1.287.126-.154 1.91-1.165 2.74-1.948 2.781H10.853z" />
    </svg>
  );
}

function BlueskyIcon({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 512 512" width={size} height={size} fill="#0085ff">
      <path d="M111.8 62.2C170.2 105.9 233 189.7 256 230c23-40.3 85.8-124.1 144.2-167.8C447.8 26.9 512 16 512 16s-10.9 64.2-46.2 111.8c-43.7 58.4-127.5 121.2-167.8 144.2 40.3 23 124.1 85.8 167.8 144.2 35.3 47.6 46.2 111.8 46.2 111.8s-64.2-10.9-111.8-46.2c-58.4-43.7-121.2-127.5-144.2-167.8-23 40.3-85.8 124.1-144.2 167.8C64.2 485.1 16 496 16 496s10.9-64.2 46.2-111.8c43.7-58.4 127.5-121.2 167.8-144.2-40.3-23-124.1-85.8-167.8-144.2C26.9 127.8 16 63.6 16 63.6s47.8 11.2 95.8 47.6z" />
    </svg>
  );
}

function PinterestIcon({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="#E60023">
      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.886 1.406-5.886s-.359-.722-.359-1.789c0-1.675.972-2.926 2.185-2.926 1.03 0 1.526.771 1.526 1.696 0 1.035-.658 2.585-.999 4.02-.283 1.2.603 2.18 1.784 2.18 2.143 0 3.791-2.261 3.791-5.524 0-2.887-2.076-4.908-5.04-4.908-3.433 0-5.449 2.572-5.449 5.234 0 1.037.4 2.146.9 2.753.1.12.115.228.085.349-.093.386-.299 1.209-.34 1.378-.053.223-.178.27-.41.163-1.529-.71-2.486-2.946-2.486-4.737 0-3.856 2.801-7.4 8.082-7.4 4.244 0 7.543 3.023 7.543 7.067 0 4.215-2.657 7.607-6.349 7.607-1.24 0-2.407-.645-2.806-1.406l-.762 2.906c-.276 1.052-1.022 2.37-1.522 3.187 1.125.347 2.316.537 3.551.537 6.621 0 11.986-5.37 11.986-11.988C24.014 5.367 18.647 0 12.017 0z" />
    </svg>
  );
}

function RedditIcon({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="#FF4500">
      <path d="M24 11.5c0-1.654-1.346-3-3-3-.964 0-1.817.458-2.36 1.16-1.625-1.122-3.826-1.822-6.242-1.9l1.322-4.148 4.31.916c.038.847.74 1.522 1.597 1.522 1.02 0 1.848-.828 1.848-1.848s-.828-1.848-1.848-1.848c-.89 0-1.626.634-1.796 1.48L12.44 2.82a.75.75 0 0 0-.904.512L10.05 7.6C7.59 7.663 5.347 8.37 3.694 9.508 3.155 8.796 2.28 8.333 1.25 8.333c-1.654 0-3 1.346-3 3 0 1.22.735 2.27 1.787 2.723-.058.26-.087.525-.087.79 0 3.738 4.544 6.786 10.15 6.786s10.15-3.048 10.15-6.786c0-.265-.03-.53-.088-.79 1.052-.453 1.788-1.503 1.788-2.723zm-16.5 2c-.828 0-1.5-.672-1.5-1.5s.672-1.5 1.5-1.5 1.5.672 1.5 1.5-.672 1.5-1.5 1.5zm10 0c-.828 0-1.5-.672-1.5-1.5s.672-1.5 1.5-1.5 1.5.672 1.5 1.5-.672 1.5-1.5 1.5z" />
    </svg>
  );
}

function XIcon({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="#000">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

/* ── Platform Data ─────────────────────────────────────────────────────────── */
const platforms = [
  {
    id: "linkedin",
    name: "LinkedIn",
    tagline: "Professional reach",
    apiLabel: "Native API",
    color: "#0077B5",
    gradFrom: "#0077B5",
    gradTo: "#00a0dc",
    bgLight: "#e8f1fb",
    Icon: LinkedInIcon,
    status: "live" as const,
    capabilities: ["Text & image posts", "Native video", "Company pages", "Article publishing"],
  },
  {
    id: "instagram",
    name: "Instagram",
    tagline: "Visual storytelling",
    apiLabel: "Meta Graph API",
    color: "#d6249f",
    gradFrom: "#fd5949",
    gradTo: "#d6249f",
    bgLight: "#fff0ed",
    Icon: InstagramIcon,
    status: "live" as const,
    capabilities: ["Feed & carousel posts", "Reels", "Business accounts", "Story scheduling"],
  },
  {
    id: "youtube",
    name: "YouTube",
    tagline: "Long-form video",
    apiLabel: "OAuth Client",
    color: "#FF0000",
    gradFrom: "#FF0000",
    gradTo: "#cc0000",
    bgLight: "#fff5d7",
    Icon: YouTubeIcon,
    status: "live" as const,
    capabilities: ["Video uploads", "Shorts", "Scheduled release", "Playlist management"],
  },
  {
    id: "threads",
    name: "Threads",
    tagline: "Conversation threads",
    apiLabel: "Threads API",
    color: "#1f2528",
    gradFrom: "#2d3748",
    gradTo: "#627078",
    bgLight: "#eceeec",
    Icon: ThreadsIcon,
    status: "live" as const,
    capabilities: ["Text posts", "Image attachments", "Reply threading", "Quote posts"],
  },
  {
    id: "bluesky",
    name: "Bluesky",
    tagline: "Open social web",
    apiLabel: "AT Protocol",
    color: "#0085ff",
    gradFrom: "#0085ff",
    gradTo: "#0060cc",
    bgLight: "#e7f3fb",
    Icon: BlueskyIcon,
    status: "live" as const,
    capabilities: ["Text posts", "Rich media", "Custom domains", "Thread support"],
  },
  {
    id: "pinterest",
    name: "Pinterest",
    tagline: "Discovery & reach",
    apiLabel: "Pinterest API",
    color: "#E60023",
    gradFrom: "#E60023",
    gradTo: "#ad081b",
    bgLight: "#fbe9ee",
    Icon: PinterestIcon,
    status: "live" as const,
    capabilities: ["Standard pins", "Board management", "Rich pins", "Idea pins"],
  },
  {
    id: "reddit",
    name: "Reddit",
    tagline: "Community publishing",
    apiLabel: "Reddit API",
    color: "#FF4500",
    gradFrom: "#FF4500",
    gradTo: "#cc3700",
    bgLight: "#fff1e3",
    Icon: RedditIcon,
    status: "live" as const,
    capabilities: ["Text & link posts", "Subreddit flair", "Image posts", "Scheduled posts"],
  },
  {
    id: "x",
    name: "X / Twitter",
    tagline: "Real-time publishing",
    apiLabel: "X API v2",
    color: "#1f2528",
    gradFrom: "#1f2528",
    gradTo: "#627078",
    bgLight: "#f0f0f0",
    Icon: XIcon,
    status: "soon" as const,
    capabilities: ["Text posts", "Thread scheduling", "Media uploads", "Quote tweets"],
  },
];

const stats = [
  { icon: Globe, label: "Platforms", value: "7+" },
  { icon: Zap, label: "Avg. publish time", value: "<2s" },
  { icon: Shield, label: "Uptime SLA", value: "99.9%" },
  { icon: RefreshCw, label: "Token refresh", value: "Auto" },
];

const howItWorks = [
  {
    step: "01",
    title: "Connect once",
    desc: "Link your accounts via secure OAuth. Tokens refresh automatically in the background — you never re-authenticate.",
  },
  {
    step: "02",
    title: "Write once",
    desc: "Draft your content in PostSync. AI adapts tone, format, and length per platform automatically.",
  },
  {
    step: "03",
    title: "Publish everywhere",
    desc: "Schedule or post instantly across all connected channels with one click.",
  },
];

export default function IntegrationsPage() {
  const [active, setActive] = useState<string | null>(null);

  return (
    <PageTransition>

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-5 pb-16 pt-20 md:px-8 md:pb-24 md:pt-28">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 -left-32 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-[#2f7867]/12 to-transparent blur-3xl" />
          <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-gradient-to-bl from-[#d05945]/8 to-transparent blur-3xl" />
        </div>

        <div className="mx-auto max-w-5xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-[#2f7867]/20 bg-[#2f7867]/8 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#2f7867]"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#2f7867]" />
            Integrations
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="marketing-display mx-auto mt-7 max-w-3xl text-center"
          >
            Every platform your
            <br />
            <span className="bg-gradient-to-r from-[#2f7867] via-[#56a98f] to-[#d05945] bg-clip-text text-transparent">
              audience lives on.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-[#4f5b62]"
          >
            PostSync connects directly through each platform&apos;s native API — no scraping,
            no broken embeds. Connect once and publish everywhere, for good.
          </motion.p>

          {/* Stat row */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.28 }}
            className="mx-auto mt-12 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4"
          >
            {stats.map((s) => (
              <div
                key={s.label}
                className="flex flex-col items-center gap-2 rounded-2xl border border-[#1f2528]/8 bg-white/70 px-4 py-5 backdrop-blur-sm"
              >
                <s.icon className="h-4 w-4 text-[#2f7867]" />
                <span className="text-2xl font-bold tracking-tight text-[#1f2528]">{s.value}</span>
                <span className="text-xs font-medium text-[#627078]">{s.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Platform Cards Grid ────────────────────────────────────────────────── */}
      <section className="px-5 pb-12 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {platforms.map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) * 0.06}>
                <motion.div
                  onHoverStart={() => setActive(p.id)}
                  onHoverEnd={() => setActive(null)}
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="group relative flex h-full cursor-default flex-col overflow-hidden rounded-3xl border border-[#1f2528]/8 bg-white shadow-[0_4px_20px_rgba(31,37,40,0.06)] transition-shadow hover:shadow-[0_16px_40px_rgba(31,37,40,0.12)]"
                >
                  {/* Gradient top accent bar */}
                  <div
                    className="h-1.5 w-full shrink-0"
                    style={{ background: `linear-gradient(90deg, ${p.gradFrom}, ${p.gradTo})` }}
                  />

                  <div className="flex flex-1 flex-col p-6">
                    {/* Icon + status row */}
                    <div className="flex items-start justify-between">
                      <div
                        className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm"
                        style={{ background: p.bgLight }}
                      >
                        <p.Icon size={26} />
                      </div>
                      <span
                        className={`mt-1 rounded-full px-2.5 py-0.5 text-[0.64rem] font-bold uppercase tracking-wider ${
                          p.status === "soon"
                            ? "bg-[#f5f0ff] text-[#7c5cbf]"
                            : "bg-[#eaf7ef] text-[#20613a]"
                        }`}
                      >
                        {p.status === "soon" ? "Coming soon" : "Live"}
                      </span>
                    </div>

                    {/* Name & tagline */}
                    <div className="mt-5">
                      <h2 className="text-lg font-bold tracking-[-0.02em] text-[#1f2528]">
                        {p.name}
                      </h2>
                      <p className="mt-0.5 text-sm text-[#627078]">{p.tagline}</p>
                    </div>

                    {/* API badge */}
                    <div className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-[#1f2528]/8 bg-[#f6f7f1] px-2.5 py-1">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: p.color }}
                      />
                      <span className="text-[0.68rem] font-bold uppercase tracking-wider text-[#627078]">
                        {p.apiLabel}
                      </span>
                    </div>

                    {/* Capabilities */}
                    <ul className="mt-5 space-y-2.5">
                      {p.capabilities.map((cap) => (
                        <li
                          key={cap}
                          className="flex items-center gap-2.5 text-[0.82rem] text-[#4f5b62]"
                        >
                          <div
                            className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                            style={{ background: p.bgLight }}
                          >
                            <Check className="h-2.5 w-2.5" style={{ color: p.color }} />
                          </div>
                          {cap}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Hover glow overlay */}
                  <AnimatePresence>
                    {active === p.id && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="pointer-events-none absolute inset-0 rounded-3xl"
                        style={{
                          background: `radial-gradient(circle at 50% 0%, ${p.gradFrom}18 0%, transparent 70%)`,
                        }}
                      />
                    )}
                  </AnimatePresence>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────────────────── */}
      <section className="px-5 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border border-[#1f2528]/8 bg-gradient-to-br from-[#1f2528] to-[#2d3a40] px-8 py-14 md:px-14 md:py-16">
              {/* Orb decorations */}
              <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[#2f7867]/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-10 -left-10 h-60 w-60 rounded-full bg-[#d05945]/10 blur-3xl" />

              <p className="relative text-xs font-bold uppercase tracking-widest text-[#56a98f]">
                How it works
              </p>
              <div className="relative mt-10 grid gap-10 md:grid-cols-3">
                {howItWorks.map((item) => (
                  <div key={item.step} className="flex flex-col gap-4">
                    <span className="text-5xl font-black text-white/10 leading-none">
                      {item.step}
                    </span>
                    <div className="h-px w-10 bg-gradient-to-r from-[#2f7867] to-transparent" />
                    <h3 className="text-lg font-bold text-white">{item.title}</h3>
                    <p className="text-sm leading-relaxed text-white/55">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────────── */}
      <section className="px-5 pb-28 md:px-8">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="flex flex-col items-center gap-6 rounded-3xl border border-[#2f7867]/20 bg-gradient-to-b from-[#f0f8f5] to-[#f6f7f1] p-10 text-center md:p-16">
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#2f7867]">
                <Globe className="h-3.5 w-3.5" />
                Don&apos;t see your platform?
              </span>
              <h2 className="text-3xl font-bold tracking-[-0.03em] text-[#1f2528] md:text-4xl">
                Tell us what you need next.
              </h2>
              <p className="max-w-lg text-base leading-relaxed text-[#5a656c]">
                We ship new integrations based on direct creator feedback — most requests go from
                idea to shipped in under a few weeks.
              </p>
              <Link href="/login" className="marketing-cta-primary">
                Request an integration
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

    </PageTransition>
  );
}
