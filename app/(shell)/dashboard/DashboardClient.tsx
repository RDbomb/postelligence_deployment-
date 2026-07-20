"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Activity, Bot, CalendarClock, Check, CircleDashed, Command,
  Layers3, MessageSquareText, Plus, Repeat2, Rocket, Send,
  ShieldCheck, Sparkles, WandSparkles,
} from "lucide-react";
import {
  getConnectedFacebookAccount, getConnectedInstagramAccount,
  getConnectedYouTubeAccount, getConnectedTwitterAccount,
  getConnectedThreadsAccount, getConnectedBlueskyAccount,
  getConnectedPinterestAccount, getConnectedLinkedInAccount,
  type SocialAccount,
} from "@/lib/integrations/social-accounts";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";

interface User {
  email?: string | null;
  user_metadata?: { full_name?: string; avatar_url?: string; name?: string };
}

interface Props {
  user: User;
  socialAccounts: SocialAccount[];
  youtubeStatus: string | null;
  metaStatus: string | null;
  instagramStatus: string | null;
  twitterStatus: string | null;
  threadsStatus: string | null;
  blueskyStatus: string | null;
  pinterestStatus: string | null;
  linkedinStatus: string | null;
  youtubeMessage: string | null;
  metaMessage: string | null;
  instagramMessage: string | null;
  twitterMessage: string | null;
  threadsMessage: string | null;
  blueskyMessage: string | null;
  pinterestMessage: string | null;
  linkedinMessage: string | null;
  redditStatus: string | null;
  redditMessage: string | null;
}

const analyticsBars = [42, 58, 51, 74, 63, 86, 78, 92, 81, 97, 88, 105];

const scheduledPosts = [
  { time: "10:00", title: "Product launch announcement", platform: "instagram", status: "scheduled", day: "Today" },
  { time: "16:00", title: "AI trends carousel", platform: "linkedin", status: "scheduled", day: "Today" },
  { time: "19:30", title: "Behind the scenes reel", platform: "facebook", status: "scheduled", day: "Today" },
  { time: "11:00", title: "Marketing tips thread", platform: "threads", status: "draft", day: "Tomorrow" },
  { time: "18:00", title: "New tutorial video", platform: "youtube", status: "queued", day: "Tomorrow" },
];

const contentQueues = [
  { label: "Scheduled", value: 24, tone: "from-cyan-300 to-blue-400" },
  { label: "Drafts", value: 12, tone: "from-violet-300 to-fuchsia-400" },
  { label: "Published", value: 56, tone: "from-emerald-300 to-teal-400" },
  { label: "Needs review", value: 3, tone: "from-amber-300 to-orange-400" },
];

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };

function PlatformLogo({ id, className }: { id: string; className?: string }) {
  if (id === "facebook") return (
    <svg className={className} viewBox="0 0 24 24"><path fill="currentColor" d="M14.2 8.4V6.7c0-.8.5-1 1.1-1h1.5V2.2A20 20 0 0 0 14 2c-2.9 0-4.8 1.7-4.8 4.9v1.5H6v3.9h3.2V22h4v-9.7h3.1l.6-3.9h-3.7Z" /></svg>
  );
  if (id === "instagram") return (
    <svg className={className} viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.4" cy="6.6" r="1.3" fill="currentColor" />
    </svg>
  );
  if (id === "linkedin") return (
    <svg className={className} viewBox="0 0 24 24"><path fill="currentColor" d="M5.1 8.9h3.6V20H5.1V8.9Zm1.8-5.5a2.1 2.1 0 1 1 0 4.2 2.1 2.1 0 0 1 0-4.2ZM10.8 8.9h3.5v1.5h.1c.5-.9 1.7-1.9 3.4-1.9 3.7 0 4.4 2.4 4.4 5.6V20h-3.6v-5.2c0-1.2 0-2.8-1.7-2.8s-2 1.3-2 2.7V20h-3.6V8.9Z" /></svg>
  );
  if (id === "youtube") return (
    <svg className={className} viewBox="0 0 24 24"><path fill="currentColor" d="M22 7.3a3 3 0 0 0-2.1-2.1C18 4.7 12 4.7 12 4.7s-6 0-7.9.5A3 3 0 0 0 2 7.3 31 31 0 0 0 1.5 12 31 31 0 0 0 2 16.7a3 3 0 0 0 2.1 2.1c1.9.5 7.9.5 7.9.5s6 0 7.9-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-4.7.5-4.7s0-2.8-.5-4.7ZM10 15.4V8.6l5.8 3.4-5.8 3.4Z" /></svg>
  );
  if (id === "threads") return (
    <svg className={className} viewBox="0 0 24 24"><path fill="currentColor" d="M12.1 22c-5.7 0-9.3-3.7-9.3-9.8C2.8 6.1 6.5 2 12 2c4.2 0 7.4 2.1 8.7 5.7l-3.4 1c-.8-2.3-2.7-3.6-5.2-3.6-3.3 0-5.4 2.7-5.4 7s2.1 6.8 5.5 6.8c2.6 0 4.3-1.3 4.3-3.2 0-1.1-.6-1.9-1.8-2.3-.6 2.2-2.3 3.5-4.6 3.5-2.6 0-4.4-1.6-4.4-3.9 0-2.4 2-4 5.1-4 .6 0 1.2 0 1.8.1-.3-1.2-1.2-1.8-2.6-1.8-1.1 0-2.1.4-3 1.2L5.6 6.2c1.2-1.1 2.8-1.7 4.6-1.7 3.3 0 5.2 1.8 5.6 5.4 2.8.8 4.4 2.8 4.4 5.5 0 4-3.1 6.6-8.1 6.6Zm-1.8-7.8c1.2 0 2-.8 2.3-2.3-.6-.1-1.1-.1-1.7-.1-1.4 0-2.2.5-2.2 1.3 0 .7.6 1.1 1.6 1.1Z" /></svg>
  );
  return (
    <svg className={className} viewBox="0 0 24 24"><path fill="currentColor" d="M7.2 4.2c2 1.5 4.1 4.5 4.8 6.1.7-1.6 2.8-4.6 4.8-6.1 1.5-1.1 3.9-2 3.9.7 0 .5-.3 4.5-.9 5.2-1.1 1.3-4.9 1.2-6.2 1.1 4.5.7 5.7 3 3.2 5.3-4.7 4.3-6.8-1.1-7.3-2.5-.1-.3-.2-.5-.2-.5s-.1.2-.2.5c-.6 1.4-2.7 6.8-7.3 2.5-2.5-2.3-1.3-4.6 3.2-5.3-1.3.1-5.1.2-6.2-1.1C2.3 9.4 2 5.4 2 4.9c0-2.7 2.4-1.8 3.9-.7Z" /></svg>
  );
}

export default function DashboardOverviewClient({
  user, socialAccounts,
  youtubeStatus, metaStatus, instagramStatus, threadsStatus,
  blueskyStatus, pinterestStatus, linkedinStatus,
  youtubeMessage, metaMessage, instagramMessage, twitterMessage,
  threadsMessage, blueskyMessage, pinterestMessage, linkedinMessage,
}: Props) {
  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Creator";

  const youtubeAccount = getConnectedYouTubeAccount(socialAccounts);
  const facebookAccount = getConnectedFacebookAccount(socialAccounts);
  const instagramAccount = getConnectedInstagramAccount(socialAccounts);
  const threadsAccount = getConnectedThreadsAccount(socialAccounts);
  const blueskyAccount = getConnectedBlueskyAccount(socialAccounts);
  const pinterestAccount = getConnectedPinterestAccount(socialAccounts);
  const linkedinAccount = getConnectedLinkedInAccount(socialAccounts);

  const platforms = useMemo(() => [
    { id: "instagram", color: "#E1306C", connected: Boolean(instagramAccount) },
    { id: "facebook",  color: "#1877F2", connected: Boolean(facebookAccount) },
    { id: "linkedin",  color: "#0A66C2", connected: Boolean(linkedinAccount) },
    { id: "youtube",   color: "#FF0033", connected: Boolean(youtubeAccount) },
    { id: "threads",   color: "#111827", connected: Boolean(threadsAccount) },
    { id: "bluesky",   color: "#1185FE", connected: Boolean(blueskyAccount) },
    { id: "pinterest", color: "#E60023", connected: Boolean(pinterestAccount) },
  ], [facebookAccount, instagramAccount, youtubeAccount, threadsAccount, blueskyAccount, pinterestAccount, linkedinAccount]);

  const connectedAccountCount = platforms.filter((p) => p.connected).length;

  const youtubeSuccess = youtubeStatus === "connected" || youtubeStatus === "disconnected";
  const metaSuccess = metaStatus === "connected" || metaStatus === "disconnected";
  const instagramSuccess = instagramStatus === "connected" || instagramStatus === "disconnected";
  const threadsSuccess = threadsStatus === "connected" || threadsStatus === "disconnected";
  const linkedinSuccess = linkedinStatus === "connected" || linkedinStatus === "disconnected";
  const blueskySuccess = blueskyStatus === "connected" || blueskyStatus === "disconnected";
  const pinterestSuccess = pinterestStatus === "connected" || pinterestStatus === "disconnected";
  const anySuccess = youtubeSuccess || metaSuccess || instagramSuccess || threadsSuccess || linkedinSuccess || blueskySuccess || pinterestSuccess;
  const hasIntegrationStatus = youtubeStatus || metaStatus || instagramStatus || threadsStatus || blueskyStatus || pinterestStatus || linkedinStatus;

  const integrationMessage =
    youtubeStatus === "connected" ? "YouTube channel connected successfully."
    : youtubeStatus === "disconnected" ? "YouTube channel disconnected."
    : instagramStatus === "connected" ? instagramMessage || "Instagram account connected successfully."
    : instagramStatus === "disconnected" ? "Instagram account disconnected."
    : metaStatus === "connected" ? metaMessage || "Facebook connected successfully."
    : metaStatus === "disconnected" ? metaMessage || "Facebook disconnected."
    : threadsStatus === "connected" ? "Threads connected successfully."
    : threadsStatus === "disconnected" ? "Threads disconnected."
    : blueskyStatus === "connected" ? "Bluesky connected successfully."
    : blueskyStatus === "disconnected" ? "Bluesky disconnected."
    : pinterestStatus === "connected" ? "Pinterest connected successfully."
    : pinterestStatus === "disconnected" ? "Pinterest disconnected."
    : linkedinStatus === "connected" ? "LinkedIn connected successfully."
    : linkedinStatus === "disconnected" ? "LinkedIn disconnected."
    : threadsMessage || pinterestMessage || instagramMessage || metaMessage || youtubeMessage;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
      className="space-y-5 pb-24"
    >
      {/* Integration status banner */}
      {hasIntegrationStatus && (
        <motion.div variants={fadeUp}>
          <GlassPanel className={cn(
            "flex items-center gap-3 px-4 py-3",
            anySuccess
              ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-100"
              : "border-rose-300/20 bg-rose-400/10 text-rose-100"
          )}>
            {anySuccess ? <ShieldCheck className="h-5 w-5" /> : <CircleDashed className="h-5 w-5" />}
            <p className="text-sm font-semibold">{integrationMessage}</p>
          </GlassPanel>
        </motion.div>
      )}

      {/* Hero + chart */}
      <motion.section variants={fadeUp} className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <GlassPanel className="glass-reflection relative overflow-hidden p-6 md:p-8">
          <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_360px]">
            <div>
              <Badge className="mb-5 border-[#2f7867]/20 bg-[#2f7867]/10 text-[#2f7867]">
                <Activity className="h-3.5 w-3.5" />
                Live publishing cockpit
              </Badge>
              <h1 className="max-w-3xl text-4xl font-black tracking-[-0.04em] text-[#1f2528] md:text-6xl">
                Good {greeting}, {displayName.split(" ")[0]}. Your content engine is humming.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[#5a656c]">
                AI found 3 stronger posting windows, 2 stale drafts, and one platform that needs attention before tonight&apos;s queue ships.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button variant="primary" onClick={() => window.location.href = "/create"}>
                  <Send className="h-4 w-4" />
                  Create post
                </Button>
                <Button variant="secondary">
                  <WandSparkles className="h-4 w-4" />
                  Generate with AI
                </Button>
              </div>
            </div>

            <div className="rounded-[26px] border border-[#1f2528]/8 bg-white/40 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-[#1f2528]">Posting activity</p>
                  <p className="text-xs text-[#5a656c]">Next 12-hour momentum</p>
                </div>
                <Badge className="border-[#2f7867]/20 bg-[#2f7867]/10 text-[#2f7867]">+18%</Badge>
              </div>
              <div className="flex h-48 items-end gap-2">
                {analyticsBars.map((value, index) => (
                  <motion.div
                    key={index}
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(18, value)}%` }}
                    transition={{ duration: 0.75, delay: index * 0.04, ease: "easeOut" }}
                    className="flex-1 rounded-t-full bg-gradient-to-t from-[#2f7867]/40 via-[#2f7867]/80 to-[#2f7867] shadow-[0_0_12px_rgba(47,120,103,0.15)]"
                  />
                ))}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                {[["24", "Scheduled"], ["56", "Published"], ["125K", "Reach"]].map(([value, label]) => (
                  <div key={label} className="rounded-2xl bg-white/30 border border-[#1f2528]/6 p-3">
                    <p className="text-xl font-black text-[#1f2528]">{value}</p>
                    <p className="text-[11px] text-[#5a656c]">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </GlassPanel>

        <GlassPanel className="p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-[#1f2528]">AI recommendations</p>
              <p className="text-xs text-[#5a656c]">Ranked by impact</p>
            </div>
            <Bot className="h-5 w-5 text-[#2f7867]" />
          </div>
          <div className="space-y-3">
            {[
              ["Move LinkedIn carousel to 4:40 PM", "Predicted +11% engagement"],
              ["Repurpose tutorial into 3 shorts", "YouTube audience is warming"],
              ["Add a Meta story follow-up", "Facebook page response is high"],
            ].map(([title, sub], index) => (
              <motion.button key={title} whileHover={{ x: 4 }}
                className="w-full rounded-2xl border border-[#1f2528]/8 bg-white/40 p-4 text-left transition hover:bg-white/60"
              >
                <div className="flex items-start gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#2f7867]/10 text-xs font-black text-[#2f7867]">
                    {index + 1}
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-[#1f2528]">{title}</span>
                    <span className="mt-1 block text-xs text-[#5a656c]">{sub}</span>
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </GlassPanel>
      </motion.section>

      {/* Timeline */}
      <motion.section variants={fadeUp} className="grid gap-5 xl:grid-cols-1">
        <GlassPanel className="p-5 md:p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#2f7867]/80">Command center</p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[#1f2528]">Content operations timeline</h2>
            </div>
            <button
              onClick={() => window.location.href = "/create"}
              className="flex items-center gap-2 rounded-full border border-[#2f7867]/20 bg-[#2f7867]/10 px-4 py-2 text-xs font-bold text-[#2f7867] hover:bg-[#2f7867]/20 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              New post
            </button>
          </div>
          <div className="space-y-3">
            {scheduledPosts.map((post, index) => {
              const platform = platforms.find((p) => p.id === post.platform);
              return (
                <motion.div key={`${post.day}-${post.time}-${post.title}`}
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative overflow-hidden rounded-2xl border border-[#1f2528]/8 bg-white/50 p-4 shadow-[0_8px_30px_rgba(31,37,40,0.03)]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 text-center">
                      <p className="text-sm font-black text-[#1f2528]">{post.time}</p>
                      <p className="text-[10px] font-bold uppercase text-[#5a656c]">{post.day}</p>
                    </div>
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white border border-[#1f2528]/8" style={{ color: platform?.color }}>
                      <PlatformLogo id={post.platform} className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[#1f2528]">{post.title}</p>
                    </div>
                    <Badge className="capitalize border-[#2f7867]/20 bg-[#2f7867]/10 text-[#2f7867]">{post.status}</Badge>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </GlassPanel>
      </motion.section>

      {/* AI copilot + pipeline health */}
      <motion.section variants={fadeUp} className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <GlassPanel className="p-5 md:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#2f7867]/80">AI copilot</p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[#1f2528]">Creative automation</h2>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#2f7867]/10 text-[#2f7867]">
              <Bot className="h-6 w-6" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              [Sparkles, "Generate post", "Fresh idea from campaign context"],
              [MessageSquareText, "Rewrite content", "Change tone, length, or angle"],
              [Repeat2, "Repurpose", "Turn one post into a full campaign"],
              [Command, "Suggest hashtags", "Rank tags by platform intent"],
              [CalendarClock, "Auto schedule", "Pick the next best posting slots"],
              [Rocket, "Launch queue", "Ship approved content faster"],
            ].map(([Icon, title, sub]) => {
              const I = Icon as typeof Sparkles;
              return (
                <button key={title as string} className="rounded-2xl border border-[#1f2528]/8 bg-white/40 p-4 text-left transition hover:-translate-y-1 hover:bg-white/60">
                  <I className="mb-4 h-5 w-5 text-[#2f7867]" />
                  <p className="text-sm font-black text-[#1f2528]">{title as string}</p>
                  <p className="mt-1 text-xs leading-5 text-[#5a656c]">{sub as string}</p>
                </button>
              );
            })}
          </div>
        </GlassPanel>

        <GlassPanel className="p-5 md:p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#2f7867]/80">Pipeline</p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[#1f2528]">Publishing system health</h2>
            </div>
            <Badge className="border-[#2f7867]/20 bg-[#2f7867]/10 text-[#2f7867]">
              <Check className="h-3.5 w-3.5" />
              Automation active
            </Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            {contentQueues.map((queue, index) => (
              <div key={queue.label} className="rounded-[24px] border border-[#1f2528]/8 bg-white/40 p-4">
                <div className={cn("mb-5 h-1.5 rounded-full bg-gradient-to-r", queue.tone)} />
                <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }} className="text-3xl font-black tracking-[-0.05em] text-[#1f2528]">
                  {queue.value}
                </motion.p>
                <p className="mt-1 text-xs text-[#5a656c]">{queue.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-[26px] border border-[#1f2528]/8 bg-white/40 p-4">
            <div className="flex items-start gap-4">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#2f7867]/10 text-[#2f7867]">
                <Layers3 className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-[#1f2528]">Automation Active</p>
                <p className="mt-1 text-sm leading-6 text-[#5a656c]">
                  Daily AI post generation is queued for 9:00 AM. Approval workflow is ready for Meta and YouTube channels.
                </p>
              </div>
              <Badge className="border-[#2f7867]/20 bg-[#2f7867]/10 text-[#2f7867]">Running</Badge>
            </div>
          </div>
        </GlassPanel>
      </motion.section>

      {/* FAB */}
    </motion.div>
  );
}