"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Play,
  Check,
  X,
  Edit2,
  Trash2,
  Clock,
  Sliders,
  History,
  Plus,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Save,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface User {
  id: string;
  email?: string | null;
}

interface AutomationSettings {
  is_enabled: boolean;
  post_time: string;
  mode: "manual" | "automatic";
  platforms: string[];
  categories: string[];
  keywords: string[];
}

interface AutomationLog {
  id: string;
  trend_title: string;
  caption: string;
  media_url: string;
  mode: "manual" | "automatic";
  status: "pending" | "approved" | "rejected" | "published" | "failed";
  scheduled_post_id?: string | null;
  created_at: string;
}

interface Props {
  user: User;
  initialSettings: AutomationSettings;
  initialLogs: AutomationLog[];
}

const AVAILABLE_PLATFORMS = [
  { id: "threads", name: "Threads" },
  { id: "instagram", name: "Instagram" },
  { id: "facebook", name: "Facebook" },
  { id: "linkedin", name: "LinkedIn" },
  { id: "bluesky", name: "Bluesky" },
  { id: "youtube", name: "YouTube" },
  { id: "twitter", name: "Twitter/X" },
];

const AVAILABLE_CATEGORIES = [
  { id: "world", name: "World Feed" },
  { id: "technology", name: "Technology" },
  { id: "business", name: "Business & Markets" },
  { id: "sports", name: "Sports" },
  { id: "entertainment", name: "Entertainment" },
  { id: "science", name: "Science" },
  { id: "health", name: "Health" }
];

export default function AutomationClient({ user, initialSettings, initialLogs }: Props) {
  const router = useRouter();

  // Settings states
  const [isEnabled, setIsEnabled] = useState(initialSettings.is_enabled);
  const [postTime, setPostTime] = useState(initialSettings.post_time || "09:00");
  const [mode, setMode] = useState<"manual" | "automatic">(initialSettings.mode || "manual");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(initialSettings.platforms || []);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialSettings.categories || ["world"]);
  const [keywordInput, setKeywordInput] = useState("");
  const [keywords, setKeywords] = useState<string[]>(initialSettings.keywords || []);

  // Logs states
  const [logs, setLogs] = useState<AutomationLog[]>(initialLogs);

  // Editing states for pending cards
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editingCaption, setEditingCaption] = useState("");

  // Loading states
  const [saving, setSaving] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [processingLogId, setProcessingLogId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
  };

  // Keyboard keywords input helper
  const handleAddKeyword = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = keywordInput.trim().toLowerCase();
      if (val && !keywords.includes(val)) {
        setKeywords([...keywords, val]);
        setKeywordInput("");
      }
    }
  };

  const handleRemoveKeyword = (kw: string) => {
    setKeywords(keywords.filter((k) => k !== kw));
  };

  // Toggle platform select
  const togglePlatform = (id: string) => {
    if (selectedPlatforms.includes(id)) {
      setSelectedPlatforms(selectedPlatforms.filter((p) => p !== id));
    } else {
      setSelectedPlatforms([...selectedPlatforms, id]);
    }
  };

  // Toggle category select
  const toggleCategory = (id: string) => {
    if (selectedCategories.includes(id)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== id));
    } else {
      setSelectedCategories([...selectedCategories, id]);
    }
  };

  // Save Settings to Database
  const handleSaveSettings = async () => {
    setSaving(true);
    setActionError(null);
    try {
      const res = await fetch("/api/automation/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_enabled: isEnabled,
          post_time: postTime,
          mode,
          platforms: selectedPlatforms,
          categories: selectedCategories,
          keywords,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save settings");
      showToast("Automation settings updated.");
    } catch (err: any) {
      setActionError(err.message || "Failed to update settings");
      showToast("Failed to update settings", "error");
    } finally {
      setSaving(false);
    }
  };

  // Manually trigger the automation generator run (simulation)
  const handleTestTrigger = async () => {
    setTriggering(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/automation/trigger?test=true&user_id=${user.id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ""}`, // Fallback structure
        }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to trigger automation");

      // Refresh logs list
      const logsRes = await fetch("/api/automation/logs");
      const logsData = await logsRes.json();
      if (logsRes.ok) {
        setLogs(logsData.logs || []);
      }

      showToast(
        data.mode === "automatic"
          ? "Automation triggered: Post generated and published!"
          : "Automation triggered: New draft pending review!"
      );
    } catch (err: any) {
      setActionError(err.message || "Failed to run automation trigger");
      showToast("Trigger failed", "error");
    } finally {
      setTriggering(false);
    }
  };

  // Reject / Discard a pending post
  const handleRejectLog = async (logId: string) => {
    setProcessingLogId(logId);
    try {
      const res = await fetch("/api/automation/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logId, action: "reject" }),
      });
      if (!res.ok) throw new Error("Failed to reject log item");

      setLogs((prev) =>
        prev.map((l) => (l.id === logId ? { ...l, status: "rejected" as const } : l))
      );
      showToast("Draft rejected.");
    } catch (err: any) {
      showToast("Action failed", "error");
    } finally {
      setProcessingLogId(null);
    }
  };

  // Save caption edits inline
  const handleSaveEdit = async (logId: string) => {
    try {
      const res = await fetch("/api/automation/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logId, action: "edit", caption: editingCaption }),
      });
      if (!res.ok) throw new Error("Failed to save edits");

      setLogs((prev) =>
        prev.map((l) => (l.id === logId ? { ...l, caption: editingCaption } : l))
      );
      setEditingLogId(null);
      showToast("Caption updated.");
    } catch (err: any) {
      showToast("Failed to save caption edits", "error");
    }
  };

  // Publish a pending post immediately
  const handlePublishNow = async (log: AutomationLog) => {
    setProcessingLogId(log.id);
    try {
      // 1. Trigger actual social publish
      const formData = new FormData();
      formData.append("caption", log.caption);
      formData.append("mediaUrl", log.media_url);
      formData.append("mediaType", "image");
      formData.append("platforms", selectedPlatforms.join(","));

      const pubRes = await fetch("/api/posts/publish", {
        method: "POST",
        body: formData,
      });
      const pubData = await pubRes.json();

      if (!pubRes.ok || !pubData.ok) {
        throw new Error(pubData.error || "Publishing failed");
      }

      // 2. Mark log as published
      const res = await fetch("/api/automation/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logId: log.id, action: "approve", status: "published" }),
      });
      if (!res.ok) throw new Error("Log status update failed");

      setLogs((prev) =>
        prev.map((l) => (l.id === log.id ? { ...l, status: "published" as const } : l))
      );
      showToast("Post published successfully!");
    } catch (err: any) {
      showToast(err.message || "Failed to publish", "error");
    } finally {
      setProcessingLogId(null);
    }
  };

  // Schedule a pending post
  const handleSchedulePost = async (log: AutomationLog) => {
    setProcessingLogId(log.id);
    try {
      // Schedule for the next configured time block or current time + 1 hour
      const schedTime = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      // 1. Insert into scheduled_posts
      const schedRes = await fetch("/api/scheduled-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: log.trend_title,
          description: log.caption,
          media_urls: log.media_url ? [log.media_url] : [],
          platforms: selectedPlatforms,
          scheduled_time: schedTime,
        }),
      });
      const schedData = await schedRes.json();
      if (!schedRes.ok) throw new Error(schedData.error || "Scheduling failed");

      // 2. Mark log as approved and bind the scheduled post id
      const res = await fetch("/api/automation/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logId: log.id,
          action: "approve",
          status: "approved",
          scheduledPostId: schedData.post.id,
        }),
      });
      if (!res.ok) throw new Error("Log status update failed");

      setLogs((prev) =>
        prev.map((l) => (l.id === log.id ? { ...l, status: "approved" as const, scheduled_post_id: schedData.post.id } : l))
      );
      showToast("Post approved and scheduled.");
    } catch (err: any) {
      showToast(err.message || "Failed to schedule", "error");
    } finally {
      setProcessingLogId(null);
    }
  };

  const pendingQueue = logs.filter((l) => l.status === "pending");
  const pastLogs = logs.filter((l) => l.status !== "pending");

  return (
    <div className="dashboard-light relative min-h-screen bg-[#f6f7f1] text-[#1f2528]">
      {/* Background Gradients */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(43,114,100,0.08),transparent_34%),linear-gradient(315deg,rgba(208,89,69,0.07),transparent_30%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(31,37,40,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(31,37,40,0.045)_1px,transparent_1px)] bg-[size:72px_72px] opacity-50" />
      </div>

      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-bold shadow-xl border backdrop-blur-md transition-all duration-300 ${
            toast.type === "error"
              ? "border-rose-200 bg-rose-50 text-rose-600"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {toast.msg}
        </div>
      )}

      <div className="relative mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between border-b border-[#1f2528]/8 pb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#2f7867]/70">Scheduler Engine</p>
            <h1 className="mt-1 text-3xl font-black tracking-[-0.03em] text-[#1f2528]">Content Automation</h1>
            <p className="mt-1 text-sm text-slate-500">
              Auto-generate drafts from Google Trends and publish them directly to your socials.
            </p>
          </div>
        </div>

        {actionError && (
          <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-600">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {actionError}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-12">
          {/* LEFT SIDEBAR: Automation Settings */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-[#1f2528]/10 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#1f2528]/8 pb-4">
                <div className="flex items-center gap-2.5">
                  <Sliders className="h-5 w-5 text-[#2f7867]" />
                  <h2 className="font-black text-sm text-[#1f2528] tracking-tight">Automation Settings</h2>
                </div>
                {/* Active switch */}
                <button
                  onClick={() => setIsEnabled(!isEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isEnabled ? "bg-[#2f7867]" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      isEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="mt-6 space-y-6">
                {/* Automation Mode */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Publishing Mode</label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setMode("manual")}
                      className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all duration-200 ${
                        mode === "manual"
                          ? "border-[#2f7867] bg-[#2f7867]/5 ring-1 ring-[#2f7867]"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-xs font-bold text-[#1f2528]">Manual Approval</span>
                      <span className="mt-1 text-[10px] leading-relaxed text-slate-400">
                        Saves drafts to the queue. Requires manual approval.
                      </span>
                    </button>
                    <button
                      onClick={() => setMode("automatic")}
                      className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all duration-200 ${
                        mode === "automatic"
                          ? "border-[#2f7867] bg-[#2f7867]/5 ring-1 ring-[#2f7867]"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-xs font-bold text-[#1f2528]">Fully Automatic</span>
                      <span className="mt-1 text-[10px] leading-relaxed text-slate-400">
                        Posts are created and published directly on schedule.
                      </span>
                    </button>
                  </div>
                </div>

                {/* Post Time */}
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <Clock className="h-3.5 w-3.5" /> Posting Schedule (Daily)
                  </label>
                  <input
                    type="time"
                    value={postTime.slice(0, 5)}
                    onChange={(e) => setPostTime(e.target.value + ":00")}
                    className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-[#1f2528] shadow-sm focus:border-[#2f7867] focus:outline-none"
                  />
                </div>

                {/* Target Channels */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Target Channels</label>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {AVAILABLE_PLATFORMS.map((p) => {
                      const selected = selectedPlatforms.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          onClick={() => togglePlatform(p.id)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                            selected
                              ? "border-[#2f7867] bg-[#2f7867] text-white"
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {p.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Trend Topics Curation */}
                <div className="border-t border-slate-100 pt-5 space-y-4">
                  <h3 className="text-xs font-black text-[#1f2528]">Trends & Curation Filters</h3>

                  {/* Categories */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Monitoring Categories</label>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {AVAILABLE_CATEGORIES.map((c) => {
                        const selected = selectedCategories.includes(c.id);
                        return (
                          <button
                            key={c.id}
                            onClick={() => toggleCategory(c.id)}
                            className={`rounded-lg border px-2.5 py-1 text-[10px] font-bold transition ${
                              selected
                                ? "border-[#2f7867] bg-[#2f7867]/10 text-[#2f7867]"
                                : "border-slate-150 bg-white text-slate-500 hover:bg-slate-50"
                            }`}
                          >
                            {c.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Keywords Input */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Keywords</label>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-2">
                      {keywords.map((kw) => (
                        <span
                          key={kw}
                          className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200"
                        >
                          {kw}
                          <button onClick={() => handleRemoveKeyword(kw)} className="text-slate-400 hover:text-slate-600">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        onKeyDown={handleAddKeyword}
                        placeholder={keywords.length === 0 ? "Type keywords and hit Enter..." : "Add keyword..."}
                        className="flex-1 bg-transparent px-1 text-xs outline-none min-w-[80px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Save settings CTA */}
                <div className="flex gap-2 border-t border-slate-100 pt-5">
                  <Button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="flex-1 rounded-xl bg-[#2f7867] text-white shadow hover:bg-[#255f52] transition text-xs font-bold"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Configurations
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleTestTrigger}
                    disabled={triggering}
                    className="rounded-xl border-slate-200 hover:bg-slate-50 transition text-xs font-bold text-slate-600 flex items-center gap-1.5"
                    title="Force Run Generator"
                  >
                    {triggering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                    Test Run
                  </Button>
                </div>
              </div>
            </div>

            {/* Storage Info Alert */}
            <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-4 text-xs leading-relaxed text-sky-800 flex gap-3">
              <Info className="h-5 w-5 text-sky-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Automated Visual Search:</span> The scheduler queries public search indexes to fetch high-resolution, factual visuals for trends automatically.
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Queue & Execution Logs */}
          <div className="lg:col-span-7 space-y-8">
            {/* 1. Pending Approvals Queue */}
            <div>
              <h2 className="text-base font-black text-[#1f2528] tracking-tight flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#2f7867]" /> Pending Approvals ({pendingQueue.length})
              </h2>

              <div className="mt-4 space-y-4">
                {pendingQueue.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/50 p-12 text-center">
                    <CheckCircle2 className="h-10 w-10 text-slate-300" />
                    <p className="mt-2 text-xs font-bold text-[#1f2528]">No posts pending review.</p>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      When trends match your settings, they will populate here for review.
                    </p>
                  </div>
                ) : (
                  pendingQueue.map((log) => {
                    const isEditing = editingLogId === log.id;
                    const charCount = isEditing ? editingCaption.length : log.caption.length;
                    const isTooLong = charCount > 500;

                    return (
                      <div key={log.id} className="rounded-2xl border border-[#1f2528]/10 bg-white p-5 shadow-sm space-y-4">
                        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Generated Trend Draft
                            </span>
                            <h3 className="font-black text-sm text-[#1f2528] tracking-tight">{log.trend_title}</h3>
                          </div>
                          <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600 border border-amber-200">
                            Needs Approval
                          </span>
                        </div>

                        {/* Media visual if present */}
                        {log.media_url && (
                          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-slate-50 border border-slate-100">
                            <img src={log.media_url} alt="" className="h-full w-full object-cover" />
                          </div>
                        )}

                        {/* Caption input or display */}
                        <div>
                          {isEditing ? (
                            <div className="space-y-1.5">
                              <textarea
                                value={editingCaption}
                                onChange={(e) => setEditingCaption(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-medium text-[#1f2528] shadow-inner focus:outline-none focus:border-[#2f7867]"
                                rows={4}
                              />
                              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                                <span>Double check compliance limits</span>
                                <span className={isTooLong ? "text-rose-500 font-extrabold" : ""}>
                                  {charCount}/500 chars
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-xl bg-[#f8f9f5] p-3 border border-[#1f2528]/5 text-xs text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">
                              {log.caption}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                          <div className="flex gap-1.5">
                            {isEditing ? (
                              <>
                                <Button
                                  onClick={() => handleSaveEdit(log.id)}
                                  className="h-8 rounded-lg bg-[#2f7867] text-white text-[10px] font-black"
                                >
                                  <Save className="h-3 w-3" /> Save Edits
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => setEditingLogId(null)}
                                  className="h-8 rounded-lg border-slate-200 text-slate-500 text-[10px] font-black"
                                >
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setEditingLogId(log.id);
                                  setEditingCaption(log.caption);
                                }}
                                className="h-8 rounded-lg border-slate-200 text-slate-600 text-[10px] font-black flex items-center gap-1"
                              >
                                <Edit2 className="h-3 w-3" /> Edit Draft
                                <span className="text-[9px] font-medium text-slate-400 ml-1">({log.caption.length}/500)</span>
                              </Button>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={() => handleRejectLog(log.id)}
                              disabled={processingLogId === log.id}
                              className="h-8 rounded-lg border-rose-200 bg-rose-50/50 text-rose-500 hover:bg-rose-50 text-[10px] font-black"
                            >
                              <X className="h-3 w-3" /> Reject
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleSchedulePost(log)}
                              disabled={processingLogId === log.id || isTooLong}
                              className="h-8 rounded-lg border-sky-200 bg-sky-50/50 text-sky-600 hover:bg-sky-50 text-[10px] font-black"
                            >
                              Approve & Schedule
                            </Button>
                            <Button
                              onClick={() => handlePublishNow(log)}
                              disabled={processingLogId === log.id || isTooLong}
                              className="h-8 rounded-lg bg-[#2f7867] text-white hover:bg-[#255f52] text-[10px] font-black"
                            >
                              {processingLogId === log.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                              Approve & Publish
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 2. Automation Execution Logs History */}
            <div>
              <h2 className="text-base font-black text-[#1f2528] tracking-tight flex items-center gap-2">
                <History className="h-4 w-4 text-slate-400" /> Activity History ({pastLogs.length})
              </h2>

              <div className="mt-4 rounded-2xl border border-[#1f2528]/10 bg-white overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-slate-100 bg-[#fbfcf9] text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="px-5 py-3.5">Trigger Time</th>
                        <th className="px-5 py-3.5">Trend Topic</th>
                        <th className="px-5 py-3.5">Mode</th>
                        <th className="px-5 py-3.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-bold text-[#1f2528]">
                      {pastLogs.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-5 py-10 text-center text-[10px] text-slate-400">
                            No automation run history recorded yet.
                          </td>
                        </tr>
                      ) : (
                        pastLogs.map((log) => {
                          const dateStr = new Date(log.created_at).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit"
                          });

                          return (
                            <tr key={log.id} className="hover:bg-slate-50/50 transition">
                              <td className="whitespace-nowrap px-5 py-3.5 font-bold text-slate-500">
                                {dateStr}
                              </td>
                              <td className="px-5 py-3.5 max-w-[200px] truncate">
                                {log.trend_title}
                              </td>
                              <td className="px-5 py-3.5 capitalize font-medium text-slate-400">
                                {log.mode}
                              </td>
                              <td className="px-5 py-3.5">
                                <span
                                  className={`inline-block rounded-md px-2 py-0.5 text-[9px] font-black border ${
                                    log.status === "published"
                                      ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                                      : log.status === "approved"
                                      ? "bg-sky-50 border-sky-200 text-sky-600"
                                      : log.status === "rejected"
                                      ? "bg-slate-50 border-slate-200 text-slate-400"
                                      : "bg-rose-50 border-rose-200 text-rose-500"
                                  }`}
                                >
                                  {log.status === "published"
                                    ? "Published"
                                    : log.status === "approved"
                                    ? "Approved"
                                    : log.status === "rejected"
                                    ? "Rejected"
                                    : "Failed"}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
