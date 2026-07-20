"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps, Legend,
} from "recharts";
import {
  Activity, AlertTriangle, Calendar, CheckCircle2, ClipboardList, Clock, FileDown, FileText,
  Lightbulb, Lock, RefreshCw, Sparkles, Target, ThumbsDown, TrendingUp, Users, XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import RoleBadge from "@/components/workspace/RoleBadge";
import { cn } from "@/lib/utils";
import type { WorkspaceMember, WorkspaceRole, ScheduledPost } from "@/types";
import type { AnalyticsDashboardData, AnalyticsPost } from "@/lib/analytics/social-analytics";
import { canExportReports, canManageReportInsights, canSubmitReport, getRoleLabel } from "@/lib/workspace/permissions";

// ── Types ─────────────────────────────────────────────────────────────────────
type WorkspaceDraftRow = {
  id: string;
  created_by: string;
  status: string;
  title: string;
  platforms: string[];
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  scheduled_time: string | null;
  rejection_reason: string | null;
};

type TeamMemberRow = WorkspaceMember & {
  email: string;
  full_name: string;
  avatar_url: string;
};

type ActivityRow = {
  id: string;
  user_id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
  user_name: string;
  user_avatar: string;
  label: string;
  metadata: Record<string, unknown>;
};

type TeamAnalyticsResponse = {
  generatedAt: string;
  servedFromCache: boolean;
  cacheStale: boolean;
  overview: {
    published: number; scheduled: number; failed: number; pendingApproval: number;
    approved: number; drafts: number; rejected: number; total: number;
  };
  drafts: WorkspaceDraftRow[];
  scheduledPosts: ScheduledPost[];
  analytics: AnalyticsDashboardData;
  members: TeamMemberRow[];
  activity: ActivityRow[];
  workspaceAccountsCount: number;
};

type ReportReview = {
  observations: string;
  recommendations: string;
  reviewer_name: string | null;
  reviewed_at: string | null;
};

type DateRangeKey = "today" | "7d" | "30d" | "custom";

type SubmittedReport = {
  id: string;
  status: "submitted" | "changes_requested" | "archived";
  submitted_by: string | null;
  submitted_by_name: string | null;
  submitted_at: string | null;
  change_request_note: string | null;
  change_requested_at: string | null;
};

// ── Constants ─────────────────────────────────────────────────────────────────
const TEAL = "#2f7867";
const STATUS_COLORS: Record<string, string> = {
  Published: "#2f7867", Scheduled: "#2563eb", "In progress": "#94a3b8", Failed: "#e11d48",
};
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const RANGE_LABELS: Record<DateRangeKey, string> = {
  today: "today", "7d": "the last 7 days", "30d": "the last 30 days", custom: "the selected period",
};

// ── Formatters ────────────────────────────────────────────────────────────────
function formatCompact(value: number | null | undefined) {
  if (value == null) return "—";
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}
function formatPercent(value: number | null | undefined) {
  if (value == null) return "—";
  return `${value.toFixed(value >= 10 ? 0 : 1)}%`;
}
function formatHours(value: number | null) {
  if (value == null) return "—";
  if (value < 1) return `${Math.round(value * 60)}m`;
  if (value < 48) return `${value.toFixed(1)}h`;
  return `${(value / 24).toFixed(1)}d`;
}
function formatHour(hour: number) {
  const h = hour % 12 || 12;
  return `${h}${hour >= 12 ? "PM" : "AM"}`;
}
function startOfDay(d: Date) { const c = new Date(d); c.setHours(0, 0, 0, 0); return c; }
function dayKey(d: Date) { return d.toISOString().slice(0, 10); }
// A date-only value like "2026-07-03" must round-trip through the exact
// same calendar day it started as. new Date("2026-07-03") parses as UTC
// midnight, and toISOString() always formats back in UTC too — for any
// timezone ahead of UTC (e.g. IST, UTC+5:30), converting that UTC-midnight
// instant to local time and back shifts the date a full day backward.
// parseLocalDate/isoDate below stay in local calendar time throughout, so
// a custom report range always saves and reloads as the exact days picked.
function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}
function isoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function rangeStart(range: DateRangeKey, customFrom: string): Date | null {
  const now = new Date();
  if (range === "today") return startOfDay(now);
  if (range === "7d") { const d = startOfDay(now); d.setDate(d.getDate() - 6); return d; }
  if (range === "30d") { const d = startOfDay(now); d.setDate(d.getDate() - 29); return d; }
  if (range === "custom" && customFrom) return startOfDay(parseLocalDate(customFrom));
  return null;
}
function rangeEnd(range: DateRangeKey, customTo: string): Date {
  if (range === "custom" && customTo) { const d = parseLocalDate(customTo); d.setHours(23, 59, 59, 999); return d; }
  const d = new Date(); d.setHours(23, 59, 59, 999); return d;
}

// ── Tooltips ──────────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[#1f2528]/10 bg-white px-4 py-3 shadow-[0_8px_30px_rgba(31,37,40,0.12)]">
      {label && <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">{label}</p>}
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-sm">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="font-medium text-[#1f2528]">{entry.name}:</span>
          <span className="font-black text-[#1f2528]">{formatCompact(entry.value as number)}</span>
        </div>
      ))}
    </div>
  );
}

// ── CSV / PDF export ──────────────────────────────────────────────────────────
function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((row) =>
    row.map((cell) => {
      const s = String(cell ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(",")
  ).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function openPrintReport(title: string, bodyHtml: string) {
  const win = window.open("", "_blank", "width=900,height=1100");
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><title>${title}</title><meta charset="utf-8" />
    <style>
      * { box-sizing: border-box; }
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; color: #1f2528; padding: 32px; max-width: 840px; margin: 0 auto; }
      h1 { font-size: 22px; margin-bottom: 4px; }
      p.sub { color: #65727a; font-size: 12px; margin-top: 0; margin-bottom: 24px; }
      h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; color: #65727a; margin: 28px 0 10px; }
      p.body-text { font-size: 13px; line-height: 1.6; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
      th, td { text-align: left; padding: 6px 10px; font-size: 12.5px; border-bottom: 1px solid #e6e8e6; }
      th { color: #65727a; font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: 0.06em; }
      .cards { display: flex; gap: 12px; margin-bottom: 4px; flex-wrap: wrap; }
      .card { border: 1px solid #e6e8e6; border-radius: 10px; padding: 12px 16px; min-width: 140px; }
      .card .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #65727a; }
      .card .value { font-size: 20px; font-weight: 900; margin-top: 2px; }
      footer { margin-top: 36px; padding-top: 14px; border-top: 1px solid #e6e8e6; font-size: 11px; color: #94a3b8; }
      @media print { body { padding: 0; } }
    </style>
  </head><body>${bodyHtml}</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}

// ── Small building blocks ──────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, tone }: { label: string; value: string; sub: string; icon: any; tone: string }) {
  return (
    <div className="rounded-xl border border-[#1f2528]/10 bg-white p-4 shadow-[0_10px_32px_rgba(31,37,40,0.06)]">
      <div className={cn("grid h-10 w-10 place-items-center rounded-xl mb-3", tone)}><Icon className="h-5 w-5" /></div>
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-black tracking-tight text-[#1f2528]">{value}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{sub}</p>
    </div>
  );
}

function Section({ title, eyebrow, action, children }: { title: string; eyebrow: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-[#1f2528]/10 bg-white p-5 shadow-[0_14px_45px_rgba(31,37,40,0.08)] md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{eyebrow}</p>
          <h3 className="mt-1 text-xl font-black text-[#1f2528]">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ message, height = 260 }: { message: string; height?: number }) {
  return (
    <div className="flex items-center justify-center rounded-xl border border-dashed border-[#1f2528]/12 bg-[#f9faf7]" style={{ height }}>
      <p className="max-w-xs text-center text-sm leading-6 text-slate-400">{message}</p>
    </div>
  );
}

// Small metric mini-table shared by the 4 role sections below.
function RoleMetricsTable({
  roleMembers, columns,
}: {
  roleMembers: TeamMemberRow[];
  columns: { label: string; value: (m: TeamMemberRow) => string | number }[];
}) {
  if (roleMembers.length === 0) {
    return <p className="rounded-xl border border-dashed border-[#1f2528]/12 bg-[#f9faf7] p-4 text-center text-xs text-slate-400">No one in this role yet.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="border-b border-[#1f2528]/10 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <th className="pb-2 pr-3">Member</th>
            {columns.map((c) => <th key={c.label} className="pb-2 pr-3 text-right">{c.label}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1f2528]/8">
          {roleMembers.map((m) => {
            const initials = (m.full_name || m.email || "?").slice(0, 2).toUpperCase();
            return (
              <tr key={m.id}>
                <td className="py-2.5 pr-3">
                  <div className="flex items-center gap-2.5">
                    {m.avatar_url ? <img src={m.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" /> : <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-[10px] font-bold text-white">{initials}</div>}
                    <span className="font-bold text-[#1f2528]">{m.full_name || m.email || "Unknown"}</span>
                  </div>
                </td>
                {columns.map((c) => <td key={c.label} className="pr-3 text-right font-bold text-[#1f2528]">{c.value(m)}</td>)}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────────
export default function TeamAnalyticsDashboard({ workspaceId, currentRole }: { workspaceId: string; currentRole: WorkspaceRole }) {
  const searchParams = useSearchParams();
  const [data, setData] = useState<TeamAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [range, setRange] = useState<DateRangeKey>("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  // Executive report workflow state
  const [reportGenerated, setReportGenerated] = useState(false);
  const [review, setReview] = useState<ReportReview | null>(null);
  const [observations, setObservations] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [savingReview, setSavingReview] = useState(false);
  const [reviewLoaded, setReviewLoaded] = useState(false);

  // Official submission workflow state — replaces "Save Review" with
  // "Submit Report" once the range has an official workspace_reports row.
  const [submittedReport, setSubmittedReport] = useState<SubmittedReport | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canExport = canExportReports(currentRole);
  const canReview = canManageReportInsights(currentRole);
  const canSubmit = canSubmitReport(currentRole);
  const isLocked = submittedReport?.status === "submitted";
  const isChangesRequested = submittedReport?.status === "changes_requested";
  const canEditReview = canReview && !isLocked;

  const load = async () => {
    try {
      const res = await fetch(`/api/workspace/${workspaceId}/analytics`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load team analytics");
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [workspaceId]);

  // Deep link from the notification bell / Reports "Edit Report" button:
  // "?editReportId=..." jumps straight to that report's exact custom date
  // range so the Analyst lands in the editable, resubmit-ready state
  // without manually re-picking the same range by hand.
  useEffect(() => {
    const editReportId = searchParams.get("editReportId");
    if (!editReportId) return;
    fetch(`/api/workspace/${workspaceId}/reports/${editReportId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.report?.range_from && json.report?.range_to) {
          setCustomFrom(json.report.range_from);
          setCustomTo(json.report.range_to);
          setRange("custom");
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, searchParams]);

  useEffect(() => {
    if (data?.cacheStale) {
      const t = setTimeout(async () => {
        await fetch(`/api/workspace/${workspaceId}/analytics/refresh`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ force: false }),
        }).catch(() => {});
        void load();
      }, 800);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.cacheStale, workspaceId]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await fetch(`/api/workspace/${workspaceId}/analytics/refresh`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ force: true }),
      });
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  // ── Derived / filtered data ────────────────────────────────────────────────
  const from = useMemo(() => rangeStart(range, customFrom), [range, customFrom]);
  const to = useMemo(() => rangeEnd(range, customTo), [range, customTo]);

  const inRange = (iso: string | null | undefined) => {
    if (!iso) return false;
    const t = new Date(iso).getTime();
    if (from && t < from.getTime()) return false;
    if (t > to.getTime()) return false;
    return true;
  };

  const filteredDrafts = useMemo(() => {
    if (!data) return [];
    return data.drafts.filter((d) => inRange(d.updated_at) || inRange(d.created_at));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, from, to]);

  const filteredActivity = useMemo(
    () => (data ? data.activity.filter((a) => inRange(a.created_at)) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, from, to]
  );

  // Re-check whether a saved Analyst review already exists whenever the
  // selected range changes — matches "Select Date Range → Generate Report
  // → Analyst Reviews" as a per-period workflow rather than one global note.
  useEffect(() => {
    if (!data) return;
    setReviewLoaded(false);
    const f = isoDate(from ?? startOfDay(new Date(0)));
    const t = isoDate(to);
    setSubmitError(null);
    fetch(`/api/workspace/${workspaceId}/report-review?from=${f}&to=${t}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.review) {
          setReview(json.review);
          setObservations(json.review.observations || "");
          setRecommendations(json.review.recommendations || "");
          setReportGenerated(true);
        } else {
          setReview(null);
          setObservations("");
          setRecommendations("");
          setReportGenerated(false);
        }
      })
      .catch(() => {})
      .finally(() => setReviewLoaded(true));

    fetch(`/api/workspace/${workspaceId}/report-submit?from=${f}&to=${t}`)
      .then((r) => r.json())
      .then((json) => setSubmittedReport(json.report || null))
      .catch(() => setSubmittedReport(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, range, customFrom, customTo]);

  async function handleGenerateReport() {
    setReportGenerated(true);
    await fetch(`/api/workspace/${workspaceId}/report-event`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "generate" }),
    }).catch(() => {});
  }

  async function handleSaveReview() {
    setSavingReview(true);
    try {
      const res = await fetch(`/api/workspace/${workspaceId}/report-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rangeKey: range, from: isoDate(from ?? startOfDay(new Date(0))), to: isoDate(to), observations, recommendations }),
      });
      const json = await res.json();
      if (res.ok) setReview(json.review);
      return res.ok;
    } finally {
      setSavingReview(false);
    }
  }

  // "Submit Report" — replaces the old "Save Review" button. Persists
  // the working Observations/Recommendations draft, then freezes a
  // full snapshot (Executive Summary, Observations, Recommendations,
  // Charts, Team & Platform Analytics) as an official workspace_reports
  // row that the Owner/Manager see in the Reports section.
  async function handleSubmitReport() {
    if (!data) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await handleSaveReview();

      const chartsData = {
        overview,
        platformRows: platformRows.map((r) => ({
          name: r.name, posts: r.posts, likes: r.likes, comments: r.comments,
          shares: r.shares, reach: r.reach, followers: r.followers, engagementRate: r.engagementRate,
        })),
        topPosts: topPosts.map((p) => ({ platform: p.platform, title: p.title, engagements: engagementScore(p) })),
        publishingIssues,
      };
      const analyticsData = {
        members: data.members.map((m) => ({ name: m.full_name || m.email || "Unknown", role: getRoleLabel(m.role as WorkspaceRole) })),
      };

      const res = await fetch(`/api/workspace/${workspaceId}/report-submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rangeKey: range,
          from: isoDate(from ?? startOfDay(new Date(0))),
          to: isoDate(to),
          observations, recommendations, executiveSummary,
          chartsData, analyticsData,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setSubmitError(json.error || "Failed to submit report."); return; }
      setSubmittedReport(json.report);
    } finally {
      setSubmitting(false);
    }
  }

  const overview = useMemo(() => {
    const src = filteredDrafts;
    return {
      published: src.filter((d) => d.status === "published").length,
      scheduled: src.filter((d) => d.status === "scheduled").length,
      inProgress: src.filter((d) => ["draft", "pending_approval", "approved"].includes(d.status)).length,
      failed: src.filter((d) => d.status === "failed").length,
      pendingApproval: src.filter((d) => d.status === "pending_approval").length,
    };
  }, [filteredDrafts]);

  const allRecentPosts: AnalyticsPost[] = useMemo(
    () => (data ? data.analytics.platforms.flatMap((p) => p.recentPosts) : []),
    [data]
  );

  const filteredPosts = useMemo(
    () => allRecentPosts.filter((p) => inRange(p.createdAt)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allRecentPosts, from, to]
  );

  const engagementScore = (p: AnalyticsPost) => (p.likes ?? 0) + (p.comments ?? 0) + (p.shares ?? 0);

  const topPosts = useMemo(
    () => [...filteredPosts].sort((a, b) => engagementScore(b) - engagementScore(a)).slice(0, 5),
    [filteredPosts]
  );
  const lowestPosts = useMemo(
    () => filteredPosts.length > 5 ? [...filteredPosts].sort((a, b) => engagementScore(a) - engagementScore(b)).slice(0, 5) : [],
    [filteredPosts]
  );

  const platformRows = data?.analytics.platforms ?? [];
  const bestPlatform = useMemo(() => {
    const withData = platformRows.filter((r) => r.posts > 0 && (r.likes !== null || r.comments !== null || r.shares !== null || r.reach !== null));
    if (withData.length === 0) return null;
    return withData.reduce((best, r) => {
      const score = (r.likes ?? 0) + (r.comments ?? 0) + (r.shares ?? 0);
      const bestScore = (best.likes ?? 0) + (best.comments ?? 0) + (best.shares ?? 0);
      return score > bestScore ? r : best;
    });
  }, [platformRows]);

  // Engagement trend: bucket filtered posts by day
  const engagementTrend = useMemo(() => {
    const byDay = new Map<string, { likes: number; comments: number; shares: number }>();
    for (const p of filteredPosts) {
      if (!p.createdAt) continue;
      const key = dayKey(new Date(p.createdAt));
      const cur = byDay.get(key) || { likes: 0, comments: 0, shares: 0 };
      cur.likes += p.likes ?? 0; cur.comments += p.comments ?? 0; cur.shares += p.shares ?? 0;
      byDay.set(key, cur);
    }
    return Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date: date.slice(5), Likes: v.likes, Comments: v.comments, Shares: v.shares }));
  }, [filteredPosts]);

  // Publishing success vs failure trend from workspace_drafts, bucketed by day (updated_at)
  const publishTrend = useMemo(() => {
    const byDay = new Map<string, { published: number; failed: number }>();
    for (const d of filteredDrafts) {
      if (d.status !== "published" && d.status !== "failed") continue;
      const key = dayKey(new Date(d.updated_at));
      const cur = byDay.get(key) || { published: 0, failed: 0 };
      if (d.status === "published") cur.published += 1; else cur.failed += 1;
      byDay.set(key, cur);
    }
    return Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date: date.slice(5), Published: v.published, Failed: v.failed }));
  }, [filteredDrafts]);

  const statusPie = useMemo(() => ([
    { name: "Published", value: overview.published },
    { name: "Scheduled", value: overview.scheduled },
    { name: "In progress", value: overview.inProgress },
    { name: "Failed", value: overview.failed },
  ].filter((s) => s.value > 0)), [overview]);

  // Best posting day/time from published scheduled_posts (frequency-based)
  const { bestDay, bestHour } = useMemo(() => {
    const posts = (data?.scheduledPosts ?? []).filter((p) => p.status === "published" && inRange(p.scheduled_time));
    const dayCounts = new Array(7).fill(0);
    const hourCounts = new Array(24).fill(0);
    for (const p of posts) {
      const d = new Date(p.scheduled_time);
      dayCounts[d.getDay()] += 1;
      hourCounts[d.getHours()] += 1;
    }
    const maxDay = dayCounts.reduce((best, v, i) => (v > dayCounts[best] ? i : best), 0);
    const maxHour = hourCounts.reduce((best, v, i) => (v > hourCounts[best] ? i : best), 0);
    return {
      bestDay: posts.length > 0 ? { label: DAY_LABELS[maxDay], count: dayCounts[maxDay] } : null,
      bestHour: posts.length > 0 ? { label: formatHour(maxHour), count: hourCounts[maxHour] } : null,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, from, to]);

  // ── Publishing issues summary ───────────────────────────────────────────
  const publishingIssues = useMemo(() => {
    const avgApprovalHours = (() => {
      const rows = filteredDrafts.filter((d) => d.submitted_at && d.reviewed_at);
      if (rows.length === 0) return null;
      return rows.reduce((s, d) => s + (new Date(d.reviewed_at!).getTime() - new Date(d.submitted_at!).getTime()) / 3600000, 0) / rows.length;
    })();
    const avgPublishHours = (() => {
      const rows = filteredDrafts.filter((d) => d.status === "published" && d.scheduled_time);
      const valid = rows
        .map((d) => (new Date(d.updated_at).getTime() - new Date(d.scheduled_time!).getTime()) / 3600000)
        .filter((h) => h >= 0);
      if (valid.length === 0) return null;
      return valid.reduce((s, h) => s + h, 0) / valid.length;
    })();
    const errorCounts = new Map<string, number>();
    for (const p of data?.scheduledPosts ?? []) {
      if (!inRange(p.updated_at)) continue;
      for (const r of p.platform_results ?? []) {
        if (r.status !== "failed" || !r.message) continue;
        const key = r.message.trim();
        errorCounts.set(key, (errorCounts.get(key) ?? 0) + 1);
      }
    }
    const commonErrors = Array.from(errorCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);
    return { avgApprovalHours, avgPublishHours, commonErrors, failedCount: overview.failed };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredDrafts, data, from, to, overview.failed]);

  // ── Role-based Team Performance ─────────────────────────────────────────
  // Each role is measured only on what that role is actually responsible
  // for — Creators and Analysts never show a "Posts Published" figure,
  // since publishing isn't a task either role can perform.
  const membersByRole = useMemo(() => {
    const groups: Record<WorkspaceRole, TeamMemberRow[]> = { owner: [], manager: [], creator: [], analyst: [] };
    for (const m of data?.members ?? []) groups[m.role as WorkspaceRole]?.push(m);
    return groups;
  }, [data]);

  const countActivity = (userId: string, action: string) =>
    filteredActivity.filter((a) => a.user_id === userId && a.action === action).length;

  // Rejection timestamps per draft (from the FULL activity log, not just the
  // filtered window) so an edit made today still counts as a "revision" even
  // if the rejection that prompted it happened slightly earlier.
  const rejectionTimeByDraft = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of data?.activity ?? []) {
      if (a.action === "draft_rejected" && a.entity_id) {
        const existing = map.get(a.entity_id);
        if (!existing || a.created_at < existing) map.set(a.entity_id, a.created_at);
      }
    }
    return map;
  }, [data]);

  const revisionsCompleted = (userId: string) =>
    filteredActivity.filter((a) => {
      if (a.action !== "draft_edited" || a.user_id !== userId || !a.entity_id) return false;
      const rejectedAt = rejectionTimeByDraft.get(a.entity_id);
      return rejectedAt != null && a.created_at > rejectedAt;
    }).length;

  const avgDraftCompletionHours = (userId: string) => {
    const rows = filteredDrafts.filter((d) => d.created_by === userId && d.submitted_at);
    if (rows.length === 0) return null;
    return rows.reduce((s, d) => s + (new Date(d.submitted_at!).getTime() - new Date(d.created_at).getTime()) / 3600000, 0) / rows.length;
  };
  const avgApprovalTimeFor = (userId: string) => {
    const rows = filteredDrafts.filter((d) => d.reviewed_by === userId && d.submitted_at && d.reviewed_at);
    if (rows.length === 0) return null;
    return rows.reduce((s, d) => s + (new Date(d.reviewed_at!).getTime() - new Date(d.submitted_at!).getTime()) / 3600000, 0) / rows.length;
  };

  // ── Export ───────────────────────────────────────────────────────────────
  const executiveSummary = useMemo(() => {
    if (!data) return "";
    const rangeLabel = RANGE_LABELS[range];
    const totalAttempts = overview.published + overview.failed;
    const successRate = totalAttempts > 0 ? Math.round((overview.published / totalAttempts) * 100) : null;
    const parts: string[] = [];
    parts.push(`Over ${rangeLabel}, the team published ${overview.published} post${overview.published === 1 ? "" : "s"}${overview.scheduled ? `, with ${overview.scheduled} more currently scheduled` : ""}.`);
    if (successRate != null) parts.push(`${successRate}% of publish attempts succeeded${overview.failed ? ` (${overview.failed} failed)` : ""}.`);
    if (bestPlatform) parts.push(`${bestPlatform.name} was the strongest channel by total engagement.`);
    if (bestDay && bestHour) parts.push(`Published posts cluster around ${bestDay.label}s near ${bestHour.label}, a reasonable default for future scheduling.`);
    if (overview.pendingApproval > 0) parts.push(`${overview.pendingApproval} draft${overview.pendingApproval === 1 ? " is" : "s are"} still awaiting approval.`);
    if (publishingIssues.avgApprovalHours != null) parts.push(`Drafts are taking an average of ${formatHours(publishingIssues.avgApprovalHours)} to move from submission to a review decision.`);
    return parts.join(" ");
  }, [data, range, overview, bestPlatform, bestDay, bestHour, publishingIssues]);

  function exportCsv() {
    if (!data || !canExport) return;
    void fetch(`/api/workspace/${workspaceId}/report-event`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "export_csv" }),
    }).catch(() => {});
    const rows: (string | number)[][] = [
      ["Team Analytics Report — Executive Summary"],
      [executiveSummary],
      [],
      ["Overview", ""],
      ["Published", overview.published],
      ["Scheduled", overview.scheduled],
      ["In progress (draft/pending/approved)", overview.inProgress],
      ["Failed", overview.failed],
      [],
      ["Platform", "Posts", "Likes", "Comments", "Shares", "Views", "Followers", "Engagement Rate"],
      ...platformRows.map((r) => [r.name, r.posts, r.likes ?? "", r.comments ?? "", r.shares ?? "", r.reach ?? "", r.followers ?? "", r.engagementRate != null ? `${r.engagementRate}%` : ""]),
      [],
      ["Top Performing Posts", "", "", ""],
      ["Platform", "Title", "Engagements"],
      ...topPosts.map((p) => [p.platform, p.title, engagementScore(p)]),
      [],
      ["Publishing Issues", ""],
      ["Failed posts", publishingIssues.failedCount],
      ["Avg. approval time", formatHours(publishingIssues.avgApprovalHours)],
      ["Avg. publish latency", formatHours(publishingIssues.avgPublishHours)],
      ...publishingIssues.commonErrors.map(([msg, count]) => [`Error: ${msg}`, count]),
      [],
      ["Analyst Observations"], [observations || "—"],
      ["Recommendations"], [recommendations || "—"],
      [],
      ["Member", "Role", ""],
      ...(data.members.map((m) => [m.full_name || m.email || "Unknown", getRoleLabel(m.role as WorkspaceRole)])),
      [],
      ["Generated", new Date().toLocaleString()],
      ["Reviewed by", review?.reviewer_name || "Not yet reviewed"],
    ];
    downloadCsv(`team-analytics-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  }

  function exportPdf() {
    if (!data || !canExport) return;
    void fetch(`/api/workspace/${workspaceId}/report-event`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "export_pdf" }),
    }).catch(() => {});
    const cards = [
      { label: "Published", value: overview.published },
      { label: "Scheduled", value: overview.scheduled },
      { label: "In progress", value: overview.inProgress },
      { label: "Failed", value: overview.failed },
    ];
    const platformTableRows = platformRows.map((r) =>
      `<tr><td>${r.name}</td><td>${r.posts}</td><td>${formatCompact(r.likes)}</td><td>${formatCompact(r.comments)}</td><td>${formatCompact(r.shares)}</td><td>${formatCompact(r.reach)}</td><td>${formatPercent(r.engagementRate)}</td></tr>`
    ).join("");
    const topRows = topPosts.map((p) => `<tr><td>${p.platform}</td><td>${p.title}</td><td>${formatCompact(engagementScore(p))}</td></tr>`).join("");
    const errorRows = publishingIssues.commonErrors.map(([m, c]) => `<tr><td>${m}</td><td>${c}</td></tr>`).join("");
    const body = `
      <h1>Team Analytics Report</h1>
      <p class="sub">Generated ${new Date().toLocaleString()} · Range: ${range === "custom" ? `${customFrom} to ${customTo}` : range}</p>
      <h2>Executive Summary</h2>
      <p class="body-text">${executiveSummary}</p>
      <h2>Overview</h2>
      <div class="cards">${cards.map((c) => `<div class="card"><div class="label">${c.label}</div><div class="value">${c.value}</div></div>`).join("")}</div>
      <h2>Platform Performance</h2>
      <table><thead><tr><th>Platform</th><th>Posts</th><th>Likes</th><th>Comments</th><th>Shares</th><th>Views</th><th>Eng. Rate</th></tr></thead><tbody>${platformTableRows}</tbody></table>
      <h2>Top Performing Posts</h2>
      <table><thead><tr><th>Platform</th><th>Title</th><th>Engagements</th></tr></thead><tbody>${topRows || "<tr><td colspan=3>No data</td></tr>"}</tbody></table>
      <h2>Publishing Issues</h2>
      <div class="cards">
        <div class="card"><div class="label">Failed posts</div><div class="value">${publishingIssues.failedCount}</div></div>
        <div class="card"><div class="label">Avg. approval time</div><div class="value">${formatHours(publishingIssues.avgApprovalHours)}</div></div>
        <div class="card"><div class="label">Avg. publish latency</div><div class="value">${formatHours(publishingIssues.avgPublishHours)}</div></div>
      </div>
      ${errorRows ? `<table><thead><tr><th>Common error</th><th>Occurrences</th></tr></thead><tbody>${errorRows}</tbody></table>` : ""}
      <h2>Analyst Observations</h2>
      <p class="body-text">${(observations || "No observations recorded yet.").replace(/\n/g, "<br/>")}</p>
      <h2>Recommendations</h2>
      <p class="body-text">${(recommendations || "No recommendations recorded yet.").replace(/\n/g, "<br/>")}</p>
      <footer>Report generator: Postelligence Team Analytics &middot; Generated ${new Date().toLocaleString()} &middot; Reviewed by ${review?.reviewer_name || "Not yet reviewed"}</footer>
    `;
    openPrintReport("Team Analytics Report", body);
  }

  // ── Render ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />)}
      </div>
    );
  }
  if (error) return <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">{error}</div>;
  if (!data) return null;

  const totals = data.analytics.totals;

  return (
    <div className="space-y-5">
      {/* ── Header: filters, refresh ──────────────────────────────────────── */}
      <section className="rounded-xl border border-[#1f2528]/10 bg-white p-5 shadow-[0_14px_45px_rgba(31,37,40,0.08)] md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge variant="outline" className="mb-3 border-[#2f7867]/20 bg-[#eaf7ef] text-[#2f7867]">
              <Sparkles className="h-3.5 w-3.5" />Team performance
            </Badge>
            <h1 className="text-3xl font-black tracking-tight text-[#1f2528] md:text-4xl">Team Analytics</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Publishing performance, engagement, and contribution across your whole workspace.
            </p>
          </div>
          <button onClick={() => void handleRefresh()} disabled={refreshing}
            className="flex items-center gap-2 rounded-xl border border-[#1f2528]/10 bg-[#f9faf7] px-4 py-2 text-sm font-bold text-[#1f2528] transition hover:bg-[#eaf3ed] hover:text-[#2f7867] disabled:opacity-60">
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            {refreshing ? "Syncing…" : "Refresh"}
          </button>
        </div>

        {/* Date filters */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#1f2528]/8 pt-4">
          <Calendar className="h-4 w-4 text-slate-400" />
          {([{ v: "today", l: "Today" }, { v: "7d", l: "Last 7 Days" }, { v: "30d", l: "Last 30 Days" }, { v: "custom", l: "Custom Range" }] as { v: DateRangeKey; l: string }[]).map((opt) => (
            <button key={opt.v} onClick={() => setRange(opt.v)}
              className={cn("rounded-full border px-3.5 py-1.5 text-xs font-bold transition",
                range === opt.v ? "border-[#2f7867]/30 bg-[#eaf3ed] text-[#1a4a3a]" : "border-[#1f2528]/12 bg-white text-slate-600 hover:border-[#1f2528]/30 hover:text-[#1f2528]")}>
              {opt.l}
            </button>
          ))}
          {range === "custom" && (
            <div className="flex items-center gap-2">
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="rounded-lg border border-[#1f2528]/15 px-2.5 py-1.5 text-xs font-bold text-[#1f2528]" />
              <span className="text-xs text-slate-400">to</span>
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="rounded-lg border border-[#1f2528]/15 px-2.5 py-1.5 text-xs font-bold text-[#1f2528]" />
            </div>
          )}
          <span className="ml-auto flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
            {data.servedFromCache && !data.cacheStale && <span className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Cached</span>}
            {data.cacheStale && <span className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-700"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" />Refreshing…</span>}
          </span>
        </div>
      </section>

      {/* ── Overall Workspace Performance ─────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Published" value={overview.published.toString()} sub="Posts live on connected accounts" icon={CheckCircle2} tone="bg-emerald-50 text-emerald-700" />
        <StatCard label="Scheduled" value={overview.scheduled.toString()} sub="Queued for future publishing" icon={Clock} tone="bg-blue-50 text-blue-700" />
        <StatCard label="Drafts" value={overview.inProgress.toString()} sub={`${overview.pendingApproval} awaiting review`} icon={FileText} tone="bg-slate-100 text-slate-600" />
        <StatCard label="Failed" value={overview.failed.toString()} sub="Publish attempts that need attention" icon={XCircle} tone="bg-rose-50 text-rose-700" />
      </div>

      {/* ── Growth metrics ─────────────────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Reach" value={formatCompact(totals.reach)} sub="Total views & impressions" icon={Target} tone="bg-cyan-50 text-cyan-700" />
        <StatCard label="Engagement Rate" value={formatPercent(totals.engagementRate)} sub="Likes + comments + shares / views" icon={Activity} tone="bg-teal-50 text-teal-700" />
        <StatCard label="Followers" value={formatCompact(totals.followers)} sub="Combined audience across platforms" icon={Users} tone="bg-blue-50 text-blue-700" />
        <StatCard label="Clicks" value="—" sub="Not exposed by any connected platform's API yet" icon={TrendingUp} tone="bg-slate-100 text-slate-500" />
      </div>

      {/* ── Platform-wise performance ──────────────────────────────────────── */}
      <Section eyebrow="By channel" title="Platform-wise Performance">
        {platformRows.length === 0 ? (
          <EmptyState message="Connect the workspace's social accounts to see platform performance." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {platformRows.map((r) => (
              <div key={r.platform} className="rounded-xl border border-[#1f2528]/10 bg-[#fbfcf8] p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-black text-white" style={{ backgroundColor: r.color }}>{r.name.slice(0, 1)}</span>
                  <p className="text-sm font-black text-[#1f2528]">{r.name}</p>
                  <Badge className="ml-auto" variant="secondary">{r.posts} posts</Badge>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div><p className="font-black text-[#1f2528]">{formatCompact(r.likes)}</p><p className="text-slate-400">Likes</p></div>
                  <div><p className="font-black text-[#1f2528]">{formatCompact(r.comments)}</p><p className="text-slate-400">Comments</p></div>
                  <div><p className="font-black text-[#1f2528]">{formatCompact(r.shares)}</p><p className="text-slate-400">Shares</p></div>
                  <div><p className="font-black text-[#1f2528]">{formatCompact(r.reach)}</p><p className="text-slate-400">Views</p></div>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Engagement rate</span><span className="font-bold text-[#1f2528]">{formatPercent(r.engagementRate)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── Engagement trends + status split ────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Section eyebrow="Over time" title="Engagement Trends">
            {engagementTrend.length === 0 ? (
              <EmptyState message="No engagement data in this range yet." />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={engagementTrend}>
                  <defs>
                    <linearGradient id="teamEngagementFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={TEAL} stopOpacity={0.28} />
                      <stop offset="100%" stopColor={TEAL} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="rgba(31,37,40,0.06)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#65727a", fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => formatCompact(v)} tick={{ fontSize: 10, fill: "#65727a" }} axisLine={false} tickLine={false} width={36} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="Likes" stroke="#f43f5e" fill="url(#teamEngagementFill)" strokeWidth={2} />
                  <Area type="monotone" dataKey="Comments" stroke="#f59e0b" fill="transparent" strokeWidth={2} />
                  <Area type="monotone" dataKey="Shares" stroke="#8b5cf6" fill="transparent" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Section>
        </div>
        <Section eyebrow="Mix" title="Status Split">
          {statusPie.length === 0 ? (
            <EmptyState message="No drafts in this range yet." height={260} />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusPie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {statusPie.map((s) => <Cell key={s.name} fill={STATUS_COLORS[s.name]} />)}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, fontWeight: 600 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Section>
      </div>

      {/* ── Top / lowest posts + best platform/time/day ────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Section eyebrow="Standouts" title="Top Performing Posts">
          {topPosts.length === 0 ? (
            <EmptyState message="No posts with engagement data in this range yet." height={200} />
          ) : (
            <div className="divide-y divide-[#1f2528]/8">
              {topPosts.map((post, i) => (
                <a key={`${post.platform}-${post.id}`} href={post.url || "#"} target={post.url ? "_blank" : undefined} rel="noreferrer"
                  className="flex items-start gap-3 py-3 transition hover:opacity-80">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#eaf3ed] text-[11px] font-black text-[#2f7867]">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#1f2528]">{post.title}</p>
                    <p className="mt-0.5 text-xs capitalize text-slate-400">{post.platform} · {formatCompact(engagementScore(post))} engagements</p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </Section>

        <div className="space-y-5">
          <div className="rounded-xl border border-[#1f2528]/10 bg-white p-5 shadow-[0_14px_45px_rgba(31,37,40,0.08)]">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Best channel</p>
            {bestPlatform ? (
              <>
                <div className="mt-2 flex items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black text-white" style={{ backgroundColor: bestPlatform.color }}>{bestPlatform.name.slice(0, 1)}</span>
                  <p className="text-xl font-black text-[#1f2528]">{bestPlatform.name}</p>
                </div>
                <p className="mt-1 text-xs text-slate-500">Highest total engagement this period</p>
              </>
            ) : <p className="mt-2 text-sm text-slate-400">Not enough data yet.</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-[#1f2528]/10 bg-white p-4 shadow-[0_10px_32px_rgba(31,37,40,0.06)]">
              <Clock className="h-4 w-4 text-[#2f7867]" />
              <p className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-400">Best time</p>
              <p className="mt-1 text-lg font-black text-[#1f2528]">{bestHour ? bestHour.label : "—"}</p>
              <p className="text-xs text-slate-400">{bestHour ? `${bestHour.count} published` : "No data yet"}</p>
            </div>
            <div className="rounded-xl border border-[#1f2528]/10 bg-white p-4 shadow-[0_10px_32px_rgba(31,37,40,0.06)]">
              <Calendar className="h-4 w-4 text-[#2f7867]" />
              <p className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-400">Best day</p>
              <p className="mt-1 text-lg font-black text-[#1f2528]">{bestDay ? bestDay.label : "—"}</p>
              <p className="text-xs text-slate-400">{bestDay ? `${bestDay.count} published` : "No data yet"}</p>
            </div>
          </div>
        </div>

        <Section eyebrow="Needs attention" title="Lowest Performing Posts">
          {lowestPosts.length === 0 ? (
            <EmptyState message="Not enough posts in this range to compare high vs. low performers." height={200} />
          ) : (
            <div className="divide-y divide-[#1f2528]/8">
              {lowestPosts.map((post) => (
                <a key={`low-${post.platform}-${post.id}`} href={post.url || "#"} target={post.url ? "_blank" : undefined} rel="noreferrer"
                  className="flex items-start gap-3 py-3 transition hover:opacity-80">
                  <ThumbsDown className="mt-1 h-3.5 w-3.5 shrink-0 text-slate-300" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#1f2528]">{post.title}</p>
                    <p className="mt-0.5 text-xs capitalize text-slate-400">{post.platform} · {formatCompact(engagementScore(post))} engagements</p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* ── Publishing success vs failure ──────────────────────────────────── */}
      <Section eyebrow="Reliability" title="Publishing Success vs Failure Trends">
        {publishTrend.length === 0 ? (
          <EmptyState message="No published or failed posts in this range yet." />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={publishTrend} barCategoryGap="30%">
              <CartesianGrid vertical={false} stroke="rgba(31,37,40,0.06)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#65727a", fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#65727a" }} axisLine={false} tickLine={false} width={28} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(47,120,103,0.05)" }} />
              <Bar dataKey="Published" stackId="s" fill="#2f7867" radius={[0, 0, 0, 0]} maxBarSize={28} />
              <Bar dataKey="Failed" stackId="s" fill="#e11d48" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Section>

      {/* ── Publishing issues summary ────────────────────────────────────────── */}
      <Section eyebrow="Troubleshooting" title="Publishing Issues">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[#1f2528]/10 bg-[#fbfcf8] p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Failed posts</p>
            <p className="mt-1 text-xl font-black text-rose-600">{publishingIssues.failedCount}</p>
          </div>
          <div className="rounded-xl border border-[#1f2528]/10 bg-[#fbfcf8] p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Avg. approval time</p>
            <p className="mt-1 text-xl font-black text-[#1f2528]">{formatHours(publishingIssues.avgApprovalHours)}</p>
          </div>
          <div className="rounded-xl border border-[#1f2528]/10 bg-[#fbfcf8] p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Avg. publish latency</p>
            <p className="mt-1 text-xl font-black text-[#1f2528]">{formatHours(publishingIssues.avgPublishHours)}</p>
          </div>
        </div>
        {publishingIssues.commonErrors.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Most common errors</p>
            <div className="space-y-2">
              {publishingIssues.commonErrors.map(([msg, count]) => (
                <div key={msg} className="flex items-start gap-2 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span className="flex-1">{msg}</span>
                  <Badge variant="secondary" className="shrink-0">{count}×</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* ── Team Performance (role-based) ───────────────────────────────────── */}
      <Section eyebrow="Per role" title="Team Performance">
        <div className="space-y-6">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-700"><RoleBadge role="creator" size="sm" />Content creation</p>
            <RoleMetricsTable roleMembers={membersByRole.creator} columns={[
              { label: "Drafts Created", value: (m) => filteredDrafts.filter((d) => d.created_by === m.user_id).length },
              { label: "Drafts Edited", value: (m) => countActivity(m.user_id, "draft_edited") },
              { label: "Submitted for Approval", value: (m) => countActivity(m.user_id, "draft_submitted") },
              { label: "Revisions Completed", value: (m) => revisionsCompleted(m.user_id) },
              { label: "Avg. Completion Time", value: (m) => formatHours(avgDraftCompletionHours(m.user_id)) },
            ]} />
          </div>

          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-700"><RoleBadge role="manager" size="sm" />Review & scheduling</p>
            <RoleMetricsTable roleMembers={membersByRole.manager} columns={[
              { label: "Posts Approved", value: (m) => countActivity(m.user_id, "draft_approved") },
              { label: "Posts Rejected", value: (m) => countActivity(m.user_id, "draft_rejected") },
              { label: "Posts Scheduled", value: (m) => countActivity(m.user_id, "draft_scheduled") },
              { label: "Posts Published", value: (m) => filteredDrafts.filter((d) => d.status === "published" && d.reviewed_by === m.user_id).length },
              { label: "Avg. Approval Time", value: (m) => formatHours(avgApprovalTimeFor(m.user_id)) },
            ]} />
          </div>

          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-purple-700"><RoleBadge role="owner" size="sm" />Full workspace oversight</p>
            <RoleMetricsTable roleMembers={membersByRole.owner} columns={[
              { label: "Posts Published", value: (m) => filteredDrafts.filter((d) => d.status === "published" && (d.created_by === m.user_id || d.reviewed_by === m.user_id)).length },
              { label: "Posts Scheduled", value: (m) => countActivity(m.user_id, "draft_scheduled") },
              { label: "Publish Now Actions", value: (m) => countActivity(m.user_id, "draft_published") },
              { label: "Scheduled Posts Managed", value: () => data.scheduledPosts.length },
              { label: "Accounts Managed", value: () => data.workspaceAccountsCount },
              { label: "Team Members Managed", value: () => data.members.length },
            ]} />
          </div>

          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-700"><RoleBadge role="analyst" size="sm" />Reporting</p>
            <RoleMetricsTable roleMembers={membersByRole.analyst} columns={[
              { label: "Reports Generated", value: (m) => countActivity(m.user_id, "report_generated") },
              { label: "Reports Exported", value: (m) => countActivity(m.user_id, "report_exported_csv") + countActivity(m.user_id, "report_exported_pdf") },
              { label: "Insights Added", value: (m) => filteredActivity.filter((a) => a.user_id === m.user_id && a.action === "report_review_saved" && a.metadata?.has_observations).length },
              { label: "Recommendations Submitted", value: (m) => filteredActivity.filter((a) => a.user_id === m.user_id && a.action === "report_review_saved" && a.metadata?.has_recommendations).length },
            ]} />
          </div>
        </div>
      </Section>

      {/* ── Recent publishing activity timeline ─────────────────────────────── */}
      <Section eyebrow="Timeline" title="Recent Publishing Activity">
        {(() => {
          const timelineActions = new Set(["draft_scheduled", "draft_published", "draft_publish_failed", "draft_submitted", "draft_approved", "draft_rejected"]);
          const timeline = filteredActivity.filter((a) => timelineActions.has(a.action)).slice(0, 15);
          if (timeline.length === 0) return <EmptyState message="No publishing activity in this range yet." height={160} />;
          return (
            <ol className="space-y-0">
              {timeline.map((a, i) => (
                <li key={a.id} className="relative flex gap-3 pb-4 pl-1 last:pb-0">
                  {i !== timeline.length - 1 && <span className="absolute left-[7px] top-4 h-full w-px bg-[#1f2528]/10" />}
                  <span className={cn("z-10 mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-white",
                    a.action === "draft_published" ? "bg-emerald-500" : a.action === "draft_publish_failed" ? "bg-rose-500" : a.action === "draft_scheduled" ? "bg-blue-500" : "bg-slate-300")} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-[#1f2528]">{a.label}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{new Date(a.created_at).toLocaleString()}</p>
                  </div>
                </li>
              ))}
            </ol>
          );
        })()}
      </Section>

      {/* ── Executive Report workflow ────────────────────────────────────────── */}
      <section className="rounded-xl border border-[#1f2528]/10 bg-gradient-to-br from-[#1f2528] to-[#2a3236] p-5 shadow-[0_14px_45px_rgba(31,37,40,0.18)] md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/50">Executive report</p>
            <h3 className="mt-1 text-xl font-black text-white">Select range → Generate → Analyst reviews → Export & share</h3>
          </div>
          {!reportGenerated ? (
            <button onClick={() => void handleGenerateReport()}
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#1f2528] transition hover:bg-[#eaf3ed]">
              <ClipboardList className="h-4 w-4" />Generate Report
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={exportCsv} disabled={!canExport}
                className={cn("flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition",
                  canExport ? "bg-white text-[#1f2528] hover:bg-[#eaf3ed]" : "cursor-not-allowed bg-white/10 text-white/40")}
                title={canExport ? undefined : "Only the Owner or Analyst can export this report."}>
                {canExport ? <FileDown className="h-4 w-4" /> : <Lock className="h-3.5 w-3.5" />}CSV
              </button>
              <button onClick={exportPdf} disabled={!canExport}
                className={cn("flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition",
                  canExport ? "bg-white text-[#1f2528] hover:bg-[#eaf3ed]" : "cursor-not-allowed bg-white/10 text-white/40")}
                title={canExport ? undefined : "Only the Owner or Analyst can export this report."}>
                {canExport ? <FileText className="h-4 w-4" /> : <Lock className="h-3.5 w-3.5" />}PDF
              </button>
            </div>
          )}
        </div>

        {reportGenerated && (
          <div className="mt-5 space-y-4">
            {/* Executive summary */}
            <div className="rounded-xl bg-white/[0.06] p-4">
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-white/50"><Sparkles className="h-3.5 w-3.5" />Executive Summary (auto-generated)</p>
              <p className="text-sm leading-6 text-white/90">{executiveSummary}</p>
            </div>

            {/* Owner requested changes banner */}
            {isChangesRequested && (
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                <div>
                  <p className="text-xs font-bold text-amber-200">
                    The Owner requested changes on this report{submittedReport?.change_requested_at ? ` · ${new Date(submittedReport.change_requested_at).toLocaleString()}` : ""}
                  </p>
                  {submittedReport?.change_request_note && (
                    <p className="mt-1 text-xs leading-5 text-amber-100/80">&ldquo;{submittedReport.change_request_note}&rdquo;</p>
                  )}
                  <p className="mt-1 text-[11px] text-amber-100/60">Update your Observations & Recommendations below, then resubmit.</p>
                </div>
              </div>
            )}

            {/* Analyst observations & recommendations */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-white/[0.06] p-4">
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-white/50"><Lightbulb className="h-3.5 w-3.5" />Analyst Observations</p>
                {canEditReview ? (
                  <textarea value={observations} onChange={(e) => setObservations(e.target.value)}
                    placeholder="What does the data show? e.g. Instagram engagement dipped after the 12th while LinkedIn held steady…"
                    className="h-28 w-full resize-none rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none" />
                ) : (
                  <p className="text-sm leading-6 text-white/80">{observations || "No observations recorded yet."}</p>
                )}
              </div>
              <div className="rounded-xl bg-white/[0.06] p-4">
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-white/50"><ClipboardList className="h-3.5 w-3.5" />Recommendations</p>
                {canEditReview ? (
                  <textarea value={recommendations} onChange={(e) => setRecommendations(e.target.value)}
                    placeholder="What should the team do next? e.g. Shift more budget toward LinkedIn, revisit the Tuesday posting slot…"
                    className="h-28 w-full resize-none rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none" />
                ) : (
                  <p className="text-sm leading-6 text-white/80">{recommendations || "No recommendations recorded yet."}</p>
                )}
              </div>
            </div>

            {canSubmit && (
              <div className="flex flex-col items-end gap-2">
                {submitError && <span className="text-xs font-semibold text-rose-300">{submitError}</span>}
                {isLocked ? (
                  <span className="flex items-center gap-1.5 rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Submitted{submittedReport?.submitted_at ? ` ${new Date(submittedReport.submitted_at).toLocaleString()}` : ""} by {submittedReport?.submitted_by_name || "you"} — visible to Owner &amp; Manager in Reports.
                  </span>
                ) : (
                  <div className="flex items-center gap-3">
                    {review?.reviewed_at && <span className="text-xs text-white/40">Draft saved {new Date(review.reviewed_at).toLocaleString()}</span>}
                    <button onClick={() => void handleSubmitReport()} disabled={submitting || savingReview || !reviewLoaded}
                      className="flex items-center gap-2 rounded-xl bg-[#2f7867] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#276554] disabled:opacity-60">
                      <ClipboardList className="h-3.5 w-3.5" />
                      {submitting ? "Submitting…" : isChangesRequested ? "Resubmit Report" : "Submit Report"}
                    </button>
                  </div>
                )}
              </div>
            )}
            {!canSubmit && isLocked && (
              <p className="text-right text-xs text-white/40">
                Submitted{submittedReport?.submitted_at ? ` ${new Date(submittedReport.submitted_at).toLocaleString()}` : ""} by {submittedReport?.submitted_by_name || "the Analyst"} — see the Reports section for view/download/archive.
              </p>
            )}

            {/* Footer */}
            <div className="border-t border-white/10 pt-3 text-[11px] text-white/40">
              Report generator: Postelligence Team Analytics · Generated {new Date(data.generatedAt).toLocaleString()} · {isLocked ? `Officially submitted by ${submittedReport?.submitted_by_name || "—"}` : `Reviewed by ${review?.reviewer_name || "Not yet reviewed"}`}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
