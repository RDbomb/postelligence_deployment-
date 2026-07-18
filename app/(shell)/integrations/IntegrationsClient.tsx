"use client";

  import { useState, useRef, useEffect } from "react";
  import { motion } from "framer-motion";
  import { Link2, MoreHorizontal, Plus, X, Check, Gauge, Loader2 } from "lucide-react";
  import { Button } from "@/components/ui/button";
  import { Badge } from "@/components/ui/badge";
  import { cn } from "@/lib/utils";
  import { PLATFORM_CONFIG } from "@/lib/types";
  import type { SocialAccount } from "@/lib/integrations/social-accounts";
  import {
    getConnectedFacebookAccount,
    getConnectedInstagramAccount,
    getConnectedYouTubeAccount,
    getConnectedThreadsAccount,
    getConnectedBlueskyAccount,
    getConnectedPinterestAccount,
    getConnectedLinkedInAccount,
  } from "@/lib/integrations/social-accounts";

  // ── Platform logo SVGs ────────────────────────────────────────────────────────
  function PlatformLogo({ id, className }: { id: string; className?: string }) {
    if (id === "facebook") return (
      <svg className={className} viewBox="0 0 24 24"><path fill="currentColor" d="M14.2 8.4V6.7c0-.8.5-1 1.1-1h1.5V2.2A20 20 0 0 0 14 2c-2.9 0-4.8 1.7-4.8 4.9v1.5H6v3.9h3.2V22h4v-9.7h3.1l.6-3.9h-3.7Z" /></svg>
    );
    if (id === "instagram") return (
      <svg className={className} viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="17.4" cy="6.6" r="1.3" fill="currentColor" /></svg>
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
    if (id === "pinterest") return (
      <svg className={className} viewBox="0 0 24 24"><path fill="currentColor" d="M12.1 2C6.6 2 3 5.6 3 10.3c0 3 1.7 5.3 4.2 6.2.4.1.6-.2.7-.5l.3-1.3c.1-.4.1-.5-.2-.9-.8-.9-1.2-2-1.2-3.2 0-3.5 2.6-6.5 6.8-6.5 3.7 0 5.7 2.3 5.7 5.3 0 4-1.8 7.3-4.4 7.3-1.4 0-2.5-1.2-2.1-2.7.4-1.8 1.2-3.7 1.2-5 0-1.2-.6-2.1-1.9-2.1-1.5 0-2.7 1.5-2.7 3.6 0 1.3.4 2.2.4 2.2l-1.8 7.4c-.4 1.8-.1 3.9 0 4.1.1.1.2.1.3 0 .1-.2 1.8-2.2 2.4-4.2l.7-2.7c.7 1.3 2 2.1 3.7 2.1 4.9 0 8.2-4.5 8.2-10.4C23 5 19.2 2 12.1 2Z" /></svg>
    );
    // Bluesky default
    return (
      <svg className={className} viewBox="0 0 24 24"><path fill="currentColor" d="M7.2 4.2c2 1.5 4.1 4.5 4.8 6.1.7-1.6 2.8-4.6 4.8-6.1 1.5-1.1 3.9-2 3.9.7 0 .5-.3 4.5-.9 5.2-1.1 1.3-4.9 1.2-6.2 1.1 4.5.7 5.7 3 3.2 5.3-4.7 4.3-6.8-1.1-7.3-2.5-.1-.3-.2-.5-.2-.5s-.1.2-.2.5c-.6 1.4-2.7 6.8-7.3 2.5-2.5-2.3-1.3-4.6 3.2-5.3-1.3.1-5.1.2-6.2-1.1C2.3 9.4 2 5.4 2 4.9c0-2.7 2.4-1.8 3.9-.7Z" /></svg>
    );
  }

  // ── Types ─────────────────────────────────────────────────────────────────────
  interface Platform {
    id: string;
    name: string;
    color: string;
    accent: string;
    connected: boolean;
    handle: string;
    avatarUrl?: string | null;
    lastSync: string;
  }

  interface Props {
    socialAccounts: SocialAccount[];
  }

  const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  function PlatformAvatar({ platform }: { platform: Platform }) {
    const [imgError, setImgError] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setMounted(true);
    }, []);

    return (
      <div
        className="grid h-11 w-11 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-55 shadow-sm"
        style={{ color: platform.color }}
      >
        {mounted && platform.connected && platform.avatarUrl && !imgError ? (
          <img 
            src={platform.avatarUrl} 
            alt="" 
            className="h-full w-full object-cover" 
            onError={() => setImgError(true)} 
          />
        ) : (
          <PlatformLogo id={platform.id} className="h-5 w-5" />
        )}
      </div>
    );
  }

  // ── Component ─────────────────────────────────────────────────────────────────
  export default function IntegrationsClient({ socialAccounts }: Props) {
    const [disconnectingPlatform, setDisconnectingPlatform] = useState<string | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const [blueskyModalOpen, setBlueskyModalOpen] = useState(false);
    const [blueskyHandle, setBlueskyHandle] = useState("");
    const [blueskyAppPassword, setBlueskyAppPassword] = useState("");
    const [blueskyConnecting, setBlueskyConnecting] = useState(false);
    const [blueskyError, setBlueskyError] = useState<string | null>(null);

    const facebookAccount  = getConnectedFacebookAccount(socialAccounts);
    const instagramAccount = getConnectedInstagramAccount(socialAccounts);
    const youtubeAccount   = getConnectedYouTubeAccount(socialAccounts);
    const threadsAccount   = getConnectedThreadsAccount(socialAccounts);
    const blueskyAccount   = getConnectedBlueskyAccount(socialAccounts);
    const pinterestAccount = getConnectedPinterestAccount(socialAccounts);
    const linkedinAccount  = getConnectedLinkedInAccount(socialAccounts);

    // Close dropdown on outside click
    useEffect(() => {
      if (!openMenuId) return;
      const handler = (e: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
          setOpenMenuId(null);
        }
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, [openMenuId]);

    const platforms: Platform[] = [
      {
        id: "instagram", name: "Instagram", color: "#E1306C", accent: "from-pink-500 to-purple-600",
        connected: Boolean(instagramAccount),
        handle: instagramAccount?.account_name ? `@${instagramAccount.account_name.replace(/^@/, "")}` : "Not connected",
        avatarUrl: instagramAccount?.account_avatar_url,
        lastSync: instagramAccount ? "Synced just now" : "Not connected",
      },
      {
        id: "facebook", name: "Facebook", color: "#1877F2", accent: "from-blue-500 to-blue-700",
        connected: Boolean(facebookAccount),
        handle: facebookAccount?.account_name || "Not connected",
        avatarUrl: facebookAccount?.account_avatar_url,
        lastSync: facebookAccount ? "Synced just now" : "Not connected",
      },
      {
        id: "linkedin", name: "LinkedIn", color: "#0A66C2", accent: "from-blue-600 to-cyan-600",
        connected: Boolean(linkedinAccount),
        handle: linkedinAccount?.account_name || "Not connected",
        avatarUrl: linkedinAccount?.account_avatar_url,
        lastSync: linkedinAccount ? "Synced just now" : "Not connected",
      },
      {
        id: "youtube", name: "YouTube", color: "#FF0000", accent: "from-red-500 to-red-700",
        connected: Boolean(youtubeAccount),
        handle: youtubeAccount?.account_name || "Not connected",
        avatarUrl: youtubeAccount?.account_avatar_url,
        lastSync: youtubeAccount ? "Synced just now" : "Not connected",
      },
      {
        id: "threads", name: "Threads", color: "#000000", accent: "from-slate-700 to-slate-900",
        connected: Boolean(threadsAccount),
        handle: threadsAccount?.account_name ? `@${threadsAccount.account_name.replace(/^@/, "")}` : "Not connected",
        avatarUrl: threadsAccount?.account_avatar_url,
        lastSync: threadsAccount ? "Synced just now" : "Not connected",
      },
      {
        id: "bluesky", name: "Bluesky", color: "#0085FF", accent: "from-sky-400 to-blue-600",
        connected: Boolean(blueskyAccount),
        handle: blueskyAccount?.account_name ? `@${blueskyAccount.account_name}` : "Not connected",
        avatarUrl: blueskyAccount?.account_avatar_url,
        lastSync: blueskyAccount ? "Synced just now" : "Not connected",
      },
      {
        id: "pinterest", name: "Pinterest", color: "#E60023", accent: "from-rose-500 to-red-700",
        connected: Boolean(pinterestAccount),
        handle: pinterestAccount?.account_name || "Not connected",
        avatarUrl: pinterestAccount?.account_avatar_url,
        lastSync: pinterestAccount ? "Synced just now" : "Not connected",
      },
    ];

    const connectedCount = platforms.filter(p => p.connected).length;

    const handleConnect = (platform: Platform) => {
      // Bluesky has no OAuth flow — it needs a handle + app password, collected via modal
      // and POSTed to the API, not a plain GET navigation (which is what every other
      // platform's OAuth "Connect" link does).
      if (platform.id === "bluesky") {
        setBlueskyError(null);
        setBlueskyModalOpen(true);
        return;
      }
      const routes: Record<string, string> = {
        instagram: "/api/integrations/instagram/connect",
        facebook:  "/api/integrations/meta/connect?platform=facebook",
        threads:   "/api/integrations/threads/connect",
        pinterest: "/api/integrations/pinterest/connect",
        youtube:   "/api/integrations/youtube/connect",
      };
      if (routes[platform.id]) window.location.href = routes[platform.id];
    };

    const connectBluesky = async () => {
      if (!blueskyHandle.trim() || !blueskyAppPassword.trim()) {
        setBlueskyError("Enter both your handle and app password.");
        return;
      }
      setBlueskyConnecting(true);
      setBlueskyError(null);
      try {
        const res = await fetch("/api/integrations/bluesky/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ handle: blueskyHandle.trim(), appPassword: blueskyAppPassword.trim() }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setBlueskyError(data?.error || "Couldn't connect to Bluesky. Check your handle and app password.");
          return;
        }
        setBlueskyModalOpen(false);
        setBlueskyHandle("");
        setBlueskyAppPassword("");
        window.location.reload();
      } catch {
        setBlueskyError("Couldn't reach the server. Try again.");
      } finally {
        setBlueskyConnecting(false);
      }
    };

    const connectLinkedIn = () => {
      window.location.href = "/api/integrations/linkedin/connect";
    };

    const disconnectLinkedIn = async () => {
      setDisconnectingPlatform("linkedin");
      try {
        await fetch("/api/integrations/linkedin/disconnect", { method: "DELETE" });
        window.location.reload();
      } catch {
        window.location.reload();
      }
    };

    const handleDisconnect = async (platform: Platform) => {
      setDisconnectingPlatform(platform.id);
      try {
        const routes: Record<string, string> = {
          instagram: "/api/integrations/meta/disconnect?platform=instagram",
          facebook:  "/api/integrations/meta/disconnect?platform=facebook",
          threads:   "/api/integrations/threads/disconnect",
          bluesky:   "/api/integrations/bluesky/disconnect",
          pinterest: "/api/integrations/pinterest/disconnect",
          youtube:   "/api/integrations/youtube/disconnect",
        };
        if (routes[platform.id]) {
          await fetch(routes[platform.id], { method: "DELETE" });
        }
        window.location.reload();
      } catch {
        window.location.reload();
      }
    };

    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
        className="p-6 md:p-8 space-y-8"
      >
        {/* Header */}
        <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 leading-none">Manage</p>
            <h1 className="mt-2.5 text-3xl font-black tracking-tight text-slate-800">Integrations</h1>
            <p className="mt-1 text-sm text-slate-500 font-medium">Connect your social media accounts to start publishing.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 px-4.5 py-3 shadow-sm flex items-center gap-3.5">
              <div>
                <p className="text-[10px] font-black uppercase text-emerald-800 tracking-wider leading-none">Connected Channels</p>
                <p className="text-2xl font-black text-emerald-950 mt-1.5 leading-none">
                  {connectedCount}
                  <span className="text-xs font-bold text-emerald-700/60 ml-0.5">/ {platforms.length}</span>
                </p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <Check className="h-5 w-5 stroke-[2.5]" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Platform list row table */}
        <motion.div variants={fadeUp} className="border border-slate-200 bg-white rounded-3xl overflow-hidden shadow-sm divide-y divide-slate-100">
          {platforms.map((platform) => {
            const platformCfg = PLATFORM_CONFIG.find((c) => c.id === platform.id);
            const isAvailable = !platformCfg || platformCfg.available;

            return (
              <div key={platform.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4.5 hover:bg-slate-50/50 transition-colors duration-150">
                
                {/* Left section: Icon avatar + Name + connection details */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative shrink-0">
                    <PlatformAvatar platform={platform} />
                    <span
                      className={cn(
                        "absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-3 border-white shadow-sm transition-colors duration-300",
                        platform.connected ? "bg-emerald-500" : "bg-slate-300"
                      )}
                    />
                  </div>

                  <div className="min-w-0 leading-tight">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-slate-800">{platform.name}</h3>
                      {!isAvailable ? (
                        <Badge className="border-amber-200 bg-amber-50 text-amber-600 font-extrabold text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-wider">Soon</Badge>
                      ) : (
                        <Badge className={cn(
                          "text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider border transition-colors",
                          platform.connected
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-slate-50 text-slate-500"
                        )}>
                          {platform.connected ? "Live" : "Offline"}
                        </Badge>
                      )}
                    </div>
                    {/* Show connection handle or Not Connected details */}
                    <p className="text-xs font-bold text-slate-500 mt-1 truncate">
                      {platform.connected ? platform.handle : "Not Connected"}
                    </p>
                    {!isAvailable && platformCfg?.comingSoonReason && (
                      <p className="text-[10px] text-amber-600 font-semibold mt-0.5 leading-normal">{platformCfg.comingSoonReason}</p>
                    )}
                  </div>
                </div>

                {/* Center-Right section: Sync Time */}
                <div className="hidden md:flex flex-col items-end shrink-0 text-right">
                  <p className="text-[11px] font-bold text-slate-400">Last Sync Status</p>
                  <p className="text-xs font-semibold text-slate-600 mt-0.5">{platform.lastSync}</p>
                </div>

                {/* Right section: Action Buttons + Dropdown */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  
                  {/* Main Action Button */}
                  {!isAvailable ? (
                    <Button variant="secondary" size="sm" className="w-28 cursor-not-allowed opacity-60 rounded-xl py-1.5 h-8 text-[11px] font-extrabold bg-slate-50 border border-slate-200/80 text-slate-400" disabled>
                      🔒 Coming Soon
                    </Button>
                  ) : platform.id === "linkedin" ? (
                    linkedinAccount ? (
                      <button
                        disabled={disconnectingPlatform === "linkedin"}
                        onClick={() => void disconnectLinkedIn()}
                        className="w-28 bg-white border border-slate-200 text-slate-600 font-bold hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition rounded-xl text-[11px] py-1.5 h-8 flex items-center justify-center gap-1 disabled:opacity-50"
                      >
                        {disconnectingPlatform === "linkedin" ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                        {disconnectingPlatform === "linkedin" ? "Disconnecting" : "Disconnect"}
                      </button>
                    ) : (
                      <button onClick={connectLinkedIn} className="w-28 bg-[#2f7867] hover:bg-[#256052] text-white font-extrabold transition rounded-xl text-[11px] py-1.5 h-8 flex items-center justify-center gap-1 shadow-sm">
                        <Plus className="h-3.5 w-3.5" /> Connect
                      </button>
                    )
                  ) : platform.connected ? (
                    <button
                      disabled={disconnectingPlatform === platform.id}
                      onClick={() => void handleDisconnect(platform)}
                      className="w-28 bg-white border border-slate-200 text-slate-600 font-bold hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition rounded-xl text-[11px] py-1.5 h-8 flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      {disconnectingPlatform === platform.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                      {disconnectingPlatform === platform.id ? "Disconnecting" : "Disconnect"}
                    </button>
                  ) : (
                    <button onClick={() => handleConnect(platform)} className="w-28 bg-[#2f7867] hover:bg-[#256052] text-white font-extrabold transition rounded-xl text-[11px] py-1.5 h-8 flex items-center justify-center gap-1 shadow-sm">
                      <Plus className="h-3.5 w-3.5" /> Connect
                    </button>
                  )}

                  {/* Dropdown Menu */}
                  <div className="relative" ref={openMenuId === platform.id ? menuRef : null}>
                    <button
                      className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition shadow-sm bg-white"
                      onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === platform.id ? null : platform.id); }}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>

                    {openMenuId === platform.id && (
                      <div className="absolute right-0 top-9.5 z-50 min-w-[150px] rounded-xl border border-slate-200 bg-white/95 backdrop-blur-md p-1 shadow-lg animate-in fade-in duration-100">
                        {platform.connected && (
                          <a
                            href={
                              platform.id === "instagram" ? "https://instagram.com" :
                              platform.id === "facebook"  ? "https://facebook.com" :
                              platform.id === "linkedin"  ? "https://linkedin.com/feed" :
                              platform.id === "youtube"   ? "https://youtube.com" :
                              platform.id === "threads"   ? "https://threads.net" :
                              platform.id === "bluesky"   ? "https://bsky.app" :
                              platform.id === "pinterest" ? "https://pinterest.com" : "#"
                            }
                            target="_blank" rel="noopener noreferrer"
                            onClick={() => setOpenMenuId(null)}
                            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                          >
                            <Link2 className="h-3.5 w-3.5 text-slate-400" />
                            View profile
                          </a>
                        )}
                        {platform.connected && platform.handle && (
                          <button
                            onClick={() => { navigator.clipboard.writeText(platform.handle); setOpenMenuId(null); }}
                            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                          >
                            <Check className="h-3.5 w-3.5 text-slate-400" />
                            Copy handle
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                </div>

              </div>
            );
          })}
        </motion.div>

        {/* Bluesky App Password Modal */}
        {blueskyModalOpen && (
          <div
            className="fixed inset-0 z-[100] grid place-items-center bg-slate-900/30 backdrop-blur-md p-4"
            onClick={() => !blueskyConnecting && setBlueskyModalOpen(false)}
          >
            <div
              className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-black text-slate-800">Connect Bluesky</h3>
              <p className="mt-1 text-sm text-slate-500 font-medium">
                Use an app password, not your main account password.{" "}
                <a
                  href="https://bsky.app/settings/app-passwords"
                  target="_blank" rel="noopener noreferrer"
                  className="font-bold text-sky-600 hover:underline"
                >
                  Create one here
                </a>.
              </p>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Handle</label>
                  <input
                    type="text"
                    value={blueskyHandle}
                    onChange={(e) => setBlueskyHandle(e.target.value)}
                    placeholder="yourname.bsky.social"
                    disabled={blueskyConnecting}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">App Password</label>
                  <input
                    type="password"
                    value={blueskyAppPassword}
                    onChange={(e) => setBlueskyAppPassword(e.target.value)}
                    placeholder="xxxx-xxxx-xxxx-xxxx"
                    disabled={blueskyConnecting}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition"
                  />
                </div>
              </div>

              {blueskyError && (
                <p className="mt-3.5 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">{blueskyError}</p>
              )}

              <div className="mt-6 flex gap-2">
                <Button
                  variant="secondary" size="sm" className="flex-1 rounded-xl py-2 h-9 text-xs font-bold"
                  disabled={blueskyConnecting}
                  onClick={() => setBlueskyModalOpen(false)}
                >
                  Cancel
                </Button>
                <button
                  disabled={blueskyConnecting}
                  onClick={() => void connectBluesky()}
                  className="flex-1 bg-[#2f7867] hover:bg-[#256052] text-white font-bold transition rounded-xl text-xs py-2 h-9 flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {blueskyConnecting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {blueskyConnecting ? "Connecting..." : "Connect"}
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    );
  }