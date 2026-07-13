"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Archive, CheckCircle2, ClipboardList, Clock, Eye, FileDown, FileText,
  Loader2, Lock, MessageSquareWarning, Pencil, Sparkles, Trash2, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkspaceRole } from "@/lib/types";
import { canManageSubmittedReports, canRequestReportChanges, canSubmitReport } from "@/lib/workspace/permissions";
import {
  downloadCsv, openPrintReport, reportCsvRows, reportPrintHtml,
  type ReportAnalyticsData, type ReportChartsData,
} from "@/lib/workspace/report-export";

// ── Types ─────────────────────────────────────────────────────
type ReportListItem = {
  id: string;
  range_key: string;
  range_from: string;
  range_to: string;
  status: "submitted" | "changes_requested" | "archived";
  submitted_by: string | null;
  submitted_by_name: string | null;
  submitted_at: string | null;
  change_request_note: string | null;
  change_requested_by_name: string | null;
  change_requested_at: string | null;
  archived_by_name: string | null;
  archived_at: string | null;
};

type ReportDetail = ReportListItem & {
  executive_summary: string;
  observations: string;
  recommendations: string;
  charts_data: ReportChartsData;
  analytics_data: ReportAnalyticsData;
};

const STATUS_META: Record<ReportListItem["status"], { label: string; className: string }> = {
  submitted:         { label: "Submitted",        className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  changes_requested: { label: "Changes requested", className: "bg-amber-50 text-amber-700 border-amber-200" },
  archived:          { label: "Archived",          className: "bg-slate-100 text-slate-500 border-slate-200" },
};

function rangeLabel(r: { range_from: string; range_to: string }) {
  return `${r.range_from} → ${r.range_to}`;
}

export default function ReportsPanel({ workspaceId, currentRole }: { workspaceId: string; currentRole: WorkspaceRole }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ReportDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [requestChangesId, setRequestChangesId] = useState<string | null>(null);
  const [changeNote, setChangeNote] = useState("");
  const [sendingChangeRequest, setSendingChangeRequest] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const canManage = canManageSubmittedReports(currentRole);
  const canRequestChanges = canRequestReportChanges(currentRole);
  // Whoever can submit/resubmit a report (Analyst, or Owner) is who the
  // "Edit Report" shortcut is for once it's been sent back for changes.
  const canEdit = canSubmitReport(currentRole);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/workspace/${workspaceId}/reports`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load reports");
      setReports(json.reports || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [workspaceId]);

  // Deep link from the notification bell: "?reportId=..." opens that
  // report's detail modal directly instead of leaving the person to
  // hunt for it in the list.
  useEffect(() => {
    const linkedId = searchParams.get("reportId");
    if (linkedId) void openReport(linkedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Jump straight into Team Performance with this report's exact date
  // range preloaded, so the Analyst lands in an editable, resubmit-ready
  // state in one click instead of re-picking the same custom range by hand.
  function navigateToEdit(id: string) {
    router.push(`/analytics?tab=team&editReportId=${id}`);
  }

  async function openReport(id: string) {
    setOpenId(id);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/workspace/${workspaceId}/reports/${id}`);
      const json = await res.json();
      if (res.ok) setDetail(json.report);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleArchive(id: string) {
    setArchivingId(id);
    try {
      const res = await fetch(`/api/workspace/${workspaceId}/reports/${id}/archive`, { method: "POST" });
      if (res.ok) {
        await load();
        if (openId === id) void openReport(id);
      }
    } finally {
      setArchivingId(null);
    }
  }

  // Owner/Manager only, and only once a report is archived — permanently
  // removes it from the workspace. Guarded by an inline confirm step
  // since this can't be undone.
  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/workspace/${workspaceId}/reports/${id}`, { method: "DELETE" });
      if (res.ok) {
        setConfirmDeleteId(null);
        if (openId === id) setOpenId(null);
        await load();
      }
    } finally {
      setDeletingId(null);
    }
  }

  async function handleRequestChanges(id: string) {
    setSendingChangeRequest(true);
    try {
      const res = await fetch(`/api/workspace/${workspaceId}/reports/${id}/request-changes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: changeNote }),
      });
      if (res.ok) {
        setRequestChangesId(null);
        setChangeNote("");
        await load();
        if (openId === id) void openReport(id);
      }
    } finally {
      setSendingChangeRequest(false);
    }
  }

  function exportReportCsv(r: ReportDetail) {
    const rows = reportCsvRows({
      rangeLabel: rangeLabel(r),
      executiveSummary: r.executive_summary,
      observations: r.observations,
      recommendations: r.recommendations,
      charts: r.charts_data,
      analytics: r.analytics_data,
      submittedByName: r.submitted_by_name,
      submittedAt: r.submitted_at,
    });
    downloadCsv(`team-analytics-report-${r.range_from}-to-${r.range_to}.csv`, rows);
  }

  function exportReportPdf(r: ReportDetail) {
    const html = reportPrintHtml({
      rangeLabel: rangeLabel(r),
      executiveSummary: r.executive_summary,
      observations: r.observations,
      recommendations: r.recommendations,
      charts: r.charts_data,
      analytics: r.analytics_data,
      submittedByName: r.submitted_by_name,
      submittedAt: r.submitted_at,
    });
    openPrintReport("Team Analytics Report", html);
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />)}
      </div>
    );
  }
  if (error) return <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">{error}</div>;

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-[#1f2528]/10 bg-white p-5 shadow-[0_14px_45px_rgba(31,37,40,0.08)] md:p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Business reports</p>
        <h2 className="mt-1 text-2xl font-black tracking-tight text-[#1f2528]">
          {canManage ? "Reports" : "My Submissions"}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          {canManage
            ? "Official Team Analytics reports submitted by the Analyst. View the full report, download it, or archive it once it's been actioned."
            : "Your submission history — reports you've officially submitted for Owner & Manager review. Submitted reports are read-only unless the Owner requests changes."}
        </p>
      </section>

      {reports.length === 0 ? (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-[#1f2528]/12 bg-[#f9faf7] p-10">
          <p className="max-w-xs text-center text-sm leading-6 text-slate-400">
            {canManage ? "No reports have been submitted yet." : "You haven't submitted a report yet. Generate one from Team Performance and click Submit Report."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => {
            const meta = STATUS_META[r.status];
            return (
              <div key={r.id} className="rounded-xl border border-[#1f2528]/10 bg-white p-4 shadow-[0_10px_32px_rgba(31,37,40,0.06)] md:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-bold", meta.className)}>{meta.label}</span>
                      <p className="text-sm font-black text-[#1f2528]">{rangeLabel(r)}</p>
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                      <Clock className="h-3 w-3" />
                      Submitted {r.submitted_at ? new Date(r.submitted_at).toLocaleString() : "—"} by {r.submitted_by_name || "Unknown"}
                    </p>
                    {r.status === "changes_requested" && r.change_request_note && (
                      <p className="mt-1.5 flex items-start gap-1.5 text-xs leading-5 text-amber-700">
                        <MessageSquareWarning className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        &ldquo;{r.change_request_note}&rdquo;
                      </p>
                    )}
                    {r.status === "archived" && (
                      <p className="mt-1 text-xs text-slate-400">Archived {r.archived_at ? new Date(r.archived_at).toLocaleString() : ""} by {r.archived_by_name || "—"}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button onClick={() => void openReport(r.id)}
                      className="flex items-center gap-1.5 rounded-lg border border-[#1f2528]/10 bg-[#f9faf7] px-3 py-1.5 text-xs font-bold text-[#1f2528] transition hover:bg-[#eaf3ed] hover:text-[#2f7867]">
                      <Eye className="h-3.5 w-3.5" />View
                    </button>
                    {canManage && r.status !== "archived" && (
                      <button onClick={() => void handleArchive(r.id)} disabled={archivingId === r.id}
                        className="flex items-center gap-1.5 rounded-lg border border-[#1f2528]/10 px-3 py-1.5 text-xs font-bold text-slate-500 transition hover:bg-slate-50 disabled:opacity-50">
                        {archivingId === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Archive className="h-3.5 w-3.5" />}Archive
                      </button>
                    )}
                    {canEdit && r.status === "changes_requested" && (
                      <button onClick={() => navigateToEdit(r.id)}
                        className="flex items-center gap-1.5 rounded-lg border border-[#2f7867]/30 bg-[#eaf3ed] px-3 py-1.5 text-xs font-bold text-[#2f7867] transition hover:bg-[#dcece2]">
                        <Pencil className="h-3.5 w-3.5" />Edit Report
                      </button>
                    )}
                    {canRequestChanges && r.status === "submitted" && (
                      <button onClick={() => { setRequestChangesId(r.id); setChangeNote(""); }}
                        className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 transition hover:bg-amber-100">
                        <MessageSquareWarning className="h-3.5 w-3.5" />Request Changes
                      </button>
                    )}
                    {/* Owner/Manager only, and only once archived — a report
                        can't be edited once archived, so this is the way to
                        clear it out of the list for good. */}
                    {canManage && r.status === "archived" && (
                      <button onClick={() => setConfirmDeleteId(r.id)} disabled={deletingId === r.id}
                        className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 transition hover:bg-rose-100 disabled:opacity-50">
                        {deletingId === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}Remove
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline request-changes composer */}
                {requestChangesId === r.id && (
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
                    <textarea value={changeNote} onChange={(e) => setChangeNote(e.target.value)}
                      placeholder="What needs to change before this can be re-submitted?"
                      className="h-20 w-full resize-none rounded-lg border border-amber-200 bg-white p-2.5 text-sm text-[#1f2528] placeholder:text-slate-400 focus:outline-none" />
                    <div className="mt-2 flex justify-end gap-2">
                      <button onClick={() => setRequestChangesId(null)} className="rounded-lg px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100">Cancel</button>
                      <button onClick={() => void handleRequestChanges(r.id)} disabled={sendingChangeRequest}
                        className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-amber-700 disabled:opacity-60">
                        {sendingChangeRequest ? "Sending…" : "Send back to Analyst"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline remove confirmation — this permanently deletes the report */}
                {confirmDeleteId === r.id && (
                  <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50/60 p-3">
                    <p className="text-xs font-semibold leading-5 text-rose-700">
                      Permanently remove this archived report? This can&apos;t be undone.
                    </p>
                    <div className="mt-2 flex justify-end gap-2">
                      <button onClick={() => setConfirmDeleteId(null)} className="rounded-lg px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100">Cancel</button>
                      <button onClick={() => void handleDelete(r.id)} disabled={deletingId === r.id}
                        className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-rose-700 disabled:opacity-60">
                        {deletingId === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        {deletingId === r.id ? "Removing…" : "Remove permanently"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Report detail modal ─────────────────────────────────── */}
      {openId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#1f2528]/50 p-4" onClick={() => setOpenId(null)}>
          <div className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 flex items-center justify-between border-b border-[#1f2528]/8 bg-white px-6 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Official report</p>
                <h3 className="text-lg font-black text-[#1f2528]">{detail ? rangeLabel(detail) : "Loading…"}</h3>
              </div>
              <button onClick={() => setOpenId(null)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>

            {detailLoading || !detail ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
            ) : (
              <div className="space-y-5 px-6 py-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-bold", STATUS_META[detail.status].className)}>{STATUS_META[detail.status].label}</span>
                  <span className="flex items-center gap-1.5 text-xs text-slate-400">
                    {detail.status === "submitted" && <Lock className="h-3 w-3" />}
                    Submitted {detail.submitted_at ? new Date(detail.submitted_at).toLocaleString() : "—"} by {detail.submitted_by_name || "Unknown"}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button onClick={() => exportReportCsv(detail)} className="flex items-center gap-2 rounded-xl border border-[#1f2528]/10 bg-[#f9faf7] px-4 py-2 text-sm font-bold text-[#1f2528] transition hover:bg-[#eaf3ed] hover:text-[#2f7867]">
                    <FileDown className="h-4 w-4" />Download CSV
                  </button>
                  <button onClick={() => exportReportPdf(detail)} className="flex items-center gap-2 rounded-xl border border-[#1f2528]/10 bg-[#f9faf7] px-4 py-2 text-sm font-bold text-[#1f2528] transition hover:bg-[#eaf3ed] hover:text-[#2f7867]">
                    <FileText className="h-4 w-4" />Download PDF
                  </button>
                  {canManage && detail.status !== "archived" && (
                    <button onClick={() => void handleArchive(detail.id)} disabled={archivingId === detail.id}
                      className="flex items-center gap-2 rounded-xl border border-[#1f2528]/10 px-4 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-50 disabled:opacity-50">
                      <Archive className="h-4 w-4" />Archive
                    </button>
                  )}
                  {canManage && detail.status === "archived" && (
                    <button onClick={() => setConfirmDeleteId(detail.id)} disabled={deletingId === detail.id}
                      className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-600 transition hover:bg-rose-100 disabled:opacity-50">
                      {deletingId === detail.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}Remove
                    </button>
                  )}
                </div>

                {confirmDeleteId === detail.id && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3">
                    <p className="text-xs font-semibold leading-5 text-rose-700">
                      Permanently remove this archived report? This can&apos;t be undone.
                    </p>
                    <div className="mt-2 flex justify-end gap-2">
                      <button onClick={() => setConfirmDeleteId(null)} className="rounded-lg px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100">Cancel</button>
                      <button onClick={() => void handleDelete(detail.id)} disabled={deletingId === detail.id}
                        className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-rose-700 disabled:opacity-60">
                        {deletingId === detail.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        {deletingId === detail.id ? "Removing…" : "Remove permanently"}
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-400"><Sparkles className="h-3.5 w-3.5" />Executive Summary</p>
                  <p className="text-sm leading-6 text-[#1f2528]">{detail.executive_summary || "—"}</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="mb-1.5 text-xs font-bold uppercase tracking-widest text-slate-400">Analyst Observations</p>
                    <p className="whitespace-pre-line text-sm leading-6 text-[#1f2528]">{detail.observations || "—"}</p>
                  </div>
                  <div>
                    <p className="mb-1.5 text-xs font-bold uppercase tracking-widest text-slate-400">Recommendations</p>
                    <p className="whitespace-pre-line text-sm leading-6 text-[#1f2528]">{detail.recommendations || "—"}</p>
                  </div>
                </div>

                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-400"><ClipboardList className="h-3.5 w-3.5" />Charts — Overview</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[
                      { label: "Published", value: detail.charts_data.overview.published },
                      { label: "Scheduled", value: detail.charts_data.overview.scheduled },
                      { label: "In progress", value: detail.charts_data.overview.inProgress },
                      { label: "Failed", value: detail.charts_data.overview.failed },
                    ].map((c) => (
                      <div key={c.label} className="rounded-lg border border-[#1f2528]/10 bg-[#f9faf7] p-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{c.label}</p>
                        <p className="text-xl font-black text-[#1f2528]">{c.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Platform Performance</p>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[480px] text-sm">
                      <thead>
                        <tr className="border-b border-[#1f2528]/10 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          <th className="pb-2 pr-3">Platform</th><th className="pb-2 pr-3 text-right">Posts</th><th className="pb-2 pr-3 text-right">Likes</th>
                          <th className="pb-2 pr-3 text-right">Comments</th><th className="pb-2 pr-3 text-right">Shares</th><th className="pb-2 text-right">Eng. Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1f2528]/8">
                        {detail.charts_data.platformRows.map((p) => (
                          <tr key={p.name}>
                            <td className="py-2 pr-3 font-bold text-[#1f2528]">{p.name}</td>
                            <td className="py-2 pr-3 text-right">{p.posts}</td>
                            <td className="py-2 pr-3 text-right">{p.likes ?? "—"}</td>
                            <td className="py-2 pr-3 text-right">{p.comments ?? "—"}</td>
                            <td className="py-2 pr-3 text-right">{p.shares ?? "—"}</td>
                            <td className="py-2 text-right">{p.engagementRate != null ? `${p.engagementRate}%` : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Team &amp; Platform Analytics — Roster</p>
                  <div className="flex flex-wrap gap-2">
                    {detail.analytics_data.members.map((m) => (
                      <span key={m.name} className="rounded-full border border-[#1f2528]/10 bg-[#f9faf7] px-3 py-1 text-xs font-semibold text-[#1f2528]">{m.name} · {m.role}</span>
                    ))}
                  </div>
                </div>

                {detail.status === "changes_requested" && (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-700">
                    <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />This report is unlocked for editing and resubmission.</span>
                    {canEdit && (
                      <button onClick={() => navigateToEdit(detail.id)}
                        className="flex items-center gap-1.5 rounded-lg bg-[#2f7867] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#26604f]">
                        <Pencil className="h-3.5 w-3.5" />Edit Report
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}