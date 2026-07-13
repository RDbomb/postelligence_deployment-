// ── Shared shape for the frozen "official report" snapshot ──────
// Stored as workspace_reports.charts_data / analytics_data and used
// to render/download a report exactly as it looked at submission
// time, independent of how live analytics may have moved since.
export type ReportPlatformRow = {
  name: string;
  posts: number;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  reach: number | null;
  followers: number | null;
  engagementRate: number | null;
};

export type ReportTopPost = { platform: string; title: string; engagements: number };

export type ReportChartsData = {
  overview: { published: number; scheduled: number; inProgress: number; failed: number; pendingApproval: number };
  platformRows: ReportPlatformRow[];
  topPosts: ReportTopPost[];
  publishingIssues: {
    failedCount: number;
    avgApprovalHours: number | null;
    avgPublishHours: number | null;
    commonErrors: [string, number][];
  };
};

export type ReportAnalyticsData = {
  members: { name: string; role: string }[];
};

// ── Formatters ────────────────────────────────────────────────
export function formatCompact(value: number | null | undefined) {
  if (value == null) return "—";
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}
export function formatPercent(value: number | null | undefined) {
  if (value == null) return "—";
  return `${value.toFixed(value >= 10 ? 0 : 1)}%`;
}
export function formatHours(value: number | null | undefined) {
  if (value == null) return "—";
  if (value < 1) return `${Math.round(value * 60)}m`;
  if (value < 48) return `${value.toFixed(1)}h`;
  return `${(value / 24).toFixed(1)}d`;
}

// ── CSV download ──────────────────────────────────────────────
export function downloadCsv(filename: string, rows: (string | number)[][]) {
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

export function reportCsvRows(opts: {
  rangeLabel: string;
  executiveSummary: string;
  observations: string;
  recommendations: string;
  charts: ReportChartsData;
  analytics: ReportAnalyticsData;
  submittedByName: string | null;
  submittedAt: string | null;
}): (string | number)[][] {
  const { rangeLabel, executiveSummary, observations, recommendations, charts, analytics, submittedByName, submittedAt } = opts;
  return [
    ["Team Analytics Report — Official Submission"],
    [`Range: ${rangeLabel}`],
    [],
    ["Executive Summary"],
    [executiveSummary || "—"],
    [],
    ["Overview", ""],
    ["Published", charts.overview.published],
    ["Scheduled", charts.overview.scheduled],
    ["In progress (draft/pending/approved)", charts.overview.inProgress],
    ["Failed", charts.overview.failed],
    [],
    ["Platform", "Posts", "Likes", "Comments", "Shares", "Views", "Followers", "Engagement Rate"],
    ...charts.platformRows.map((r) => [r.name, r.posts, r.likes ?? "", r.comments ?? "", r.shares ?? "", r.reach ?? "", r.followers ?? "", r.engagementRate != null ? `${r.engagementRate}%` : ""]),
    [],
    ["Top Performing Posts", "", ""],
    ["Platform", "Title", "Engagements"],
    ...charts.topPosts.map((p) => [p.platform, p.title, p.engagements]),
    [],
    ["Publishing Issues", ""],
    ["Failed posts", charts.publishingIssues.failedCount],
    ["Avg. approval time", formatHours(charts.publishingIssues.avgApprovalHours)],
    ["Avg. publish latency", formatHours(charts.publishingIssues.avgPublishHours)],
    ...charts.publishingIssues.commonErrors.map(([msg, count]) => [`Error: ${msg}`, count]),
    [],
    ["Analyst Observations"], [observations || "—"],
    ["Recommendations"], [recommendations || "—"],
    [],
    ["Member", "Role"],
    ...analytics.members.map((m) => [m.name, m.role]),
    [],
    ["Submitted by", submittedByName || "—"],
    ["Submitted at", submittedAt ? new Date(submittedAt).toLocaleString() : "—"],
  ];
}

// ── PDF (print) export ────────────────────────────────────────
export function openPrintReport(title: string, bodyHtml: string) {
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

export function reportPrintHtml(opts: {
  rangeLabel: string;
  executiveSummary: string;
  observations: string;
  recommendations: string;
  charts: ReportChartsData;
  analytics: ReportAnalyticsData;
  submittedByName: string | null;
  submittedAt: string | null;
}): string {
  const { rangeLabel, executiveSummary, observations, recommendations, charts, analytics, submittedByName, submittedAt } = opts;
  const cards = [
    { label: "Published", value: charts.overview.published },
    { label: "Scheduled", value: charts.overview.scheduled },
    { label: "In progress", value: charts.overview.inProgress },
    { label: "Failed", value: charts.overview.failed },
  ];
  const platformTableRows = charts.platformRows.map((r) =>
    `<tr><td>${r.name}</td><td>${r.posts}</td><td>${formatCompact(r.likes)}</td><td>${formatCompact(r.comments)}</td><td>${formatCompact(r.shares)}</td><td>${formatCompact(r.reach)}</td><td>${formatPercent(r.engagementRate)}</td></tr>`
  ).join("");
  const topRows = charts.topPosts.map((p) => `<tr><td>${p.platform}</td><td>${p.title}</td><td>${formatCompact(p.engagements)}</td></tr>`).join("");
  const errorRows = charts.publishingIssues.commonErrors.map(([m, c]) => `<tr><td>${m}</td><td>${c}</td></tr>`).join("");
  const memberRows = analytics.members.map((m) => `<tr><td>${m.name}</td><td>${m.role}</td></tr>`).join("");

  return `
    <h1>Team Analytics Report</h1>
    <p class="sub">Official submission &middot; Range: ${rangeLabel} &middot; Submitted by ${submittedByName || "—"} on ${submittedAt ? new Date(submittedAt).toLocaleString() : "—"}</p>
    <h2>Executive Summary</h2>
    <p class="body-text">${executiveSummary || "—"}</p>
    <h2>Overview</h2>
    <div class="cards">${cards.map((c) => `<div class="card"><div class="label">${c.label}</div><div class="value">${c.value}</div></div>`).join("")}</div>
    <h2>Platform Performance</h2>
    <table><thead><tr><th>Platform</th><th>Posts</th><th>Likes</th><th>Comments</th><th>Shares</th><th>Views</th><th>Eng. Rate</th></tr></thead><tbody>${platformTableRows}</tbody></table>
    <h2>Top Performing Posts</h2>
    <table><thead><tr><th>Platform</th><th>Title</th><th>Engagements</th></tr></thead><tbody>${topRows || "<tr><td colspan=3>No data</td></tr>"}</tbody></table>
    <h2>Publishing Issues</h2>
    <div class="cards">
      <div class="card"><div class="label">Failed posts</div><div class="value">${charts.publishingIssues.failedCount}</div></div>
      <div class="card"><div class="label">Avg. approval time</div><div class="value">${formatHours(charts.publishingIssues.avgApprovalHours)}</div></div>
      <div class="card"><div class="label">Avg. publish latency</div><div class="value">${formatHours(charts.publishingIssues.avgPublishHours)}</div></div>
    </div>
    ${errorRows ? `<table><thead><tr><th>Common error</th><th>Occurrences</th></tr></thead><tbody>${errorRows}</tbody></table>` : ""}
    <h2>Analyst Observations</h2>
    <p class="body-text">${(observations || "No observations recorded.").replace(/\n/g, "<br/>")}</p>
    <h2>Recommendations</h2>
    <p class="body-text">${(recommendations || "No recommendations recorded.").replace(/\n/g, "<br/>")}</p>
    <h2>Team &amp; Platform Analytics — Workspace Roster</h2>
    <table><thead><tr><th>Member</th><th>Role</th></tr></thead><tbody>${memberRows || "<tr><td colspan=2>No members</td></tr>"}</tbody></table>
    <footer>Report generator: PostSync Team Analytics &middot; Official submitted report &middot; Submitted by ${submittedByName || "—"}</footer>
  `;
}
