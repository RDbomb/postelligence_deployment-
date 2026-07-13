"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  LifeBuoy,
  PenTool,
  Calendar,
  Link2,
  BarChart3,
  Users,
  Shield,
  ChevronDown,
  Paperclip,
  Send,
  Loader2,
  CheckCircle2,
  Circle,
  AlertTriangle,
  XCircle,
  ThumbsUp,
  Mail,
  MessageCircle,
  Clock,
  ExternalLink,
  Sparkles,
  Rocket,
  Bug,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface User {
  email?: string | null;
  user_metadata?: { full_name?: string; avatar_url?: string; name?: string };
}

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

/* ────────────────────────────────────────────────────────────────────────
 * DEMO DATA — everything below is static/placeholder content. Swap these
 * for real API calls (e.g. `/api/support/tickets`, `/api/support/status`)
 * when the backend is ready; the components consuming them don't need to
 * change shape.
 * ──────────────────────────────────────────────────────────────────────── */

const HELP_CATEGORIES = [
  { id: "getting-started", title: "Getting Started", description: "Connect accounts, compose your first post, and learn the basics.", icon: Rocket, color: "#2f7867", bg: "#eaf7ef", articleCount: 12 },
  { id: "compose-publish", title: "Compose & Publishing", description: "Writing posts, attaching media, and publishing across platforms.", icon: PenTool, color: "#0A66C2", bg: "#eaf3fb", articleCount: 18 },
  { id: "scheduling", title: "Scheduling & Calendar", description: "Queueing posts, time zones, and recurring schedules.", icon: Calendar, color: "#E1306C", bg: "#fdeef3", articleCount: 9 },
  { id: "integrations", title: "Integrations", description: "Connecting and troubleshooting Instagram, LinkedIn, YouTube, and more.", icon: Link2, color: "#E60023", bg: "#fdecee", articleCount: 21 },
  { id: "analytics", title: "Analytics & Reports", description: "Understanding your metrics, exports, and team reporting.", icon: BarChart3, color: "#111827", bg: "#f1f2f4", articleCount: 8 },
  { id: "team-workspace", title: "Team & Workspace", description: "Roles, permissions, and managing members in a shared workspace.", icon: Users, color: "#7c3aed", bg: "#f3eefd", articleCount: 11 },
  { id: "billing", title: "Billing & Plans", description: "Subscriptions, invoices, and upgrading or downgrading your plan.", icon: Shield, color: "#d05945", bg: "#fdefec", articleCount: 6 },
  { id: "security", title: "Account & Security", description: "Password resets, two-factor auth, and data privacy questions.", icon: LifeBuoy, color: "#1185FE", bg: "#eaf3fd", articleCount: 7 },
];

const FAQS = [
  { id: "faq-1", category: "Getting Started", question: "How do I connect a new social account?", answer: "Go to Integrations from the sidebar, pick the platform you want to connect, and follow the on-screen authorization steps. Once connected, the account becomes available as a publishing target in Compose." },
  { id: "faq-2", category: "Compose & Publishing", question: "Can I schedule the same post to multiple platforms at once?", answer: "Yes. In Compose, select every connected platform you want to publish to before scheduling or publishing — PostSync automatically adapts formatting per platform where needed." },
  { id: "faq-3", category: "Compose & Publishing", question: "Why did my post fail to publish?", answer: "Publishing failures are usually caused by an expired platform token, unsupported media format, or a platform-specific requirement (like YouTube requiring video). Check the failure reason on the post's detail view for specifics." },
  { id: "faq-4", category: "Scheduling & Calendar", question: "What time zone are scheduled posts published in?", answer: "Scheduled times use your account's local time zone by default. You can confirm the exact time by hovering over any entry in the Calendar view." },
  { id: "faq-5", category: "Team & Workspace", question: "What's the difference between Creator, Manager, and Analyst roles?", answer: "Creators draft and submit content, Managers review, approve, schedule, and publish, and Analysts focus on reporting and insights. Owners have full oversight across all of the above." },
  { id: "faq-6", category: "Billing & Plans", question: "Can I change my plan at any time?", answer: "Yes, you can upgrade or downgrade from Settings at any time. Changes are prorated and reflected on your next billing cycle." },
  { id: "faq-7", category: "Integrations", question: "Why does an integration show as 'Attention' or 'Offline'?", answer: "This usually means the platform's access token needs to be refreshed, or the platform has flagged the connection. Reconnecting the account from the Integrations page typically resolves it." },
  { id: "faq-8", category: "Account & Security", question: "Does PostSync support two-factor authentication?", answer: "Two-factor authentication can be enabled from Settings → Security. We strongly recommend enabling it for any workspace with multiple members." },
];

const SAMPLE_TICKETS = [
  { id: "TCK-1042", subject: "LinkedIn video upload stuck at 'processing'", category: "Integrations", status: "in_progress", priority: "high", updated: "2026-07-09" },
  { id: "TCK-1038", subject: "Can't remove a teammate from workspace", category: "Team & Workspace", status: "open", priority: "medium", updated: "2026-07-08" },
  { id: "TCK-1021", subject: "Analytics export missing Bluesky data", category: "Analytics & Reports", status: "resolved", priority: "low", updated: "2026-07-05" },
  { id: "TCK-0997", subject: "Question about annual billing discount", category: "Billing & Plans", status: "closed", priority: "low", updated: "2026-06-29" },
  { id: "TCK-0981", subject: "Scheduled post published to the wrong account", category: "Scheduling & Calendar", status: "resolved", priority: "high", updated: "2026-06-24" },
];

const SYSTEM_STATUS = [
  { name: "Publishing Engine", status: "operational", uptime: "99.98%" },
  { name: "Scheduler", status: "operational", uptime: "99.95%" },
  { name: "AI Studio", status: "operational", uptime: "99.91%" },
  { name: "Media Library", status: "degraded", uptime: "98.60%" },
  { name: "Integrations API", status: "operational", uptime: "99.87%" },
  { name: "Analytics & Reports", status: "operational", uptime: "99.99%" },
];

const FEATURE_REQUESTS = [
  { id: "fr-1", title: "Bulk-schedule posts from a CSV import", description: "Let us upload a spreadsheet of posts and have them queued automatically.", votes: 214, status: "planned", tag: "Scheduling" },
  { id: "fr-2", title: "Native TikTok publishing", description: "Add TikTok as a connected platform alongside the existing integrations.", votes: 189, status: "under_review", tag: "Integrations" },
  { id: "fr-3", title: "Campaign tagging for grouped analytics", description: "Group related posts under a campaign to see combined reach and engagement.", votes: 156, status: "under_review", tag: "Analytics" },
  { id: "fr-4", title: "Approval comments on drafts", description: "Let reviewers leave inline comments before approving a draft for publishing.", votes: 98, status: "planned", tag: "Team" },
  { id: "fr-5", title: "Dark mode", description: "A dark theme for the whole workspace, not just the compose screen.", votes: 132, status: "shipped", tag: "Interface" },
];

const RELEASE_NOTES = [
  { date: "July 2026", tag: "New", icon: Sparkles, color: "#2f7867", bg: "#eaf7ef", title: "Multi-image attachments in Compose", copy: "Attach several images to a single post directly from Compose or Team Compose, with a gallery preview and per-image removal." },
  { date: "June 2026", tag: "New", icon: Sparkles, color: "#2f7867", bg: "#eaf7ef", title: "Bluesky & Reddit publishing", copy: "Connect Bluesky and Reddit accounts and publish natively alongside your other channels." },
  { date: "June 2026", tag: "Fix", icon: Bug, color: "#d05945", bg: "#fdefec", title: "Fixed duplicate scheduled posts", copy: "Resolved an edge case where retrying a failed publish could create a duplicate entry on the Calendar." },
  { date: "May 2026", tag: "Improved", icon: Wrench, color: "#0A66C2", bg: "#eaf3fb", title: "Faster Analytics loading", copy: "Team analytics dashboards now load significantly faster for workspaces with large post histories." },
];

const CATEGORY_OPTIONS = ["Getting Started", "Compose & Publishing", "Scheduling & Calendar", "Integrations", "Analytics & Reports", "Team & Workspace", "Billing & Plans", "Account & Security"];
const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Urgent"];

/* ── small shared bits ─────────────────────────────────────────────── */

function SectionCard({ title, eyebrow, action, children }: { title: string; eyebrow: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[#1f2528]/10 bg-white p-5 shadow-[0_8px_32px_rgba(31,37,40,0.08)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{eyebrow}</p>
          <h2 className="mt-1 text-lg font-black tracking-[-0.02em] text-[#1f2528]">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

const STATUS_STYLES: Record<string, { label: string; className: string; icon: typeof Circle }> = {
  open: { label: "Open", className: "border-blue-200 bg-blue-50 text-blue-700", icon: Circle },
  in_progress: { label: "In Progress", className: "border-amber-200 bg-amber-50 text-amber-700", icon: Clock },
  resolved: { label: "Resolved", className: "border-emerald-200 bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
  closed: { label: "Closed", className: "border-slate-200 bg-slate-100 text-slate-500", icon: XCircle },
};

const PRIORITY_STYLES: Record<string, string> = {
  low: "text-slate-500",
  medium: "text-amber-600",
  high: "text-rose-600",
};

const SYSTEM_STATUS_STYLES: Record<string, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  operational: { label: "Operational", className: "text-[#2f7867] bg-[#eaf7ef] border-[#2f7867]/15", icon: CheckCircle2 },
  degraded: { label: "Degraded", className: "text-amber-600 bg-amber-50 border-amber-200", icon: AlertTriangle },
  outage: { label: "Outage", className: "text-rose-600 bg-rose-50 border-rose-200", icon: XCircle },
};

const FEATURE_STATUS_STYLES: Record<string, { label: string; className: string }> = {
  planned: { label: "Planned", className: "border-blue-200 bg-blue-50 text-blue-700" },
  under_review: { label: "Under Review", className: "border-amber-200 bg-amber-50 text-amber-700" },
  shipped: { label: "Shipped", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
};

export default function SupportClient({ user }: { user: User }) {
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "there";

  const [searchQuery, setSearchQuery] = useState("");
  const [openFaqId, setOpenFaqId] = useState<string | null>("faq-1");

  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketCategory, setTicketCategory] = useState(CATEGORY_OPTIONS[0]);
  const [ticketPriority, setTicketPriority] = useState(PRIORITY_OPTIONS[1]);
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketFileName, setTicketFileName] = useState<string | null>(null);
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [ticketSubmitted, setTicketSubmitted] = useState(false);

  const [upvoted, setUpvoted] = useState<Set<string>>(new Set());

  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return HELP_CATEGORIES;
    return HELP_CATEGORIES.filter((c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
  }, [searchQuery]);

  const filteredFaqs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return FAQS;
    return FAQS.filter((f) => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q) || f.category.toLowerCase().includes(q));
  }, [searchQuery]);

  // Demo-only submit: no backend call yet — just simulates a request so the
  // form is presentation-ready. Swap the setTimeout for a real fetch to
  // `/api/support/tickets` once that endpoint exists.
  const submitTicket = () => {
    if (!ticketSubject.trim() || !ticketDescription.trim()) return;
    setSubmittingTicket(true);
    window.setTimeout(() => {
      setSubmittingTicket(false);
      setTicketSubmitted(true);
      setTicketSubject("");
      setTicketDescription("");
      setTicketFileName(null);
      window.setTimeout(() => setTicketSubmitted(false), 4000);
    }, 900);
  };

  const toggleUpvote = (id: string) => {
    setUpvoted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <motion.section variants={fadeUp} initial="hidden" animate="visible" className="mx-auto max-w-6xl">
      {/* ── Header + search ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-[-0.03em] text-[#1f2528]">Support</h1>
        <p className="mt-1 text-sm text-slate-500">Hi {displayName.split(" ")[0]}, how can we help today?</p>
      </div>

      <div className="mb-6 rounded-lg border border-[#1f2528]/10 bg-white p-5 shadow-[0_8px_32px_rgba(31,37,40,0.08)]">
        <label className="flex items-center gap-3 rounded-lg border border-[#1f2528]/12 bg-[#f9faf7] px-4 py-3 focus-within:border-[#2f7867]/50 focus-within:bg-white">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            className="min-w-0 flex-1 bg-transparent text-sm text-[#1f2528] outline-none placeholder:text-slate-400"
            placeholder='Search the Help Center — e.g. "connect Instagram", "scheduling"...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-xs font-bold text-slate-400 hover:text-[#1f2528]">Clear</button>
          )}
        </label>
      </div>

      {/* ── Help Center categories ── */}
      <SectionCard eyebrow="Help Center" title="Browse by category">
        {filteredCategories.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No categories match “{searchQuery}”.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {filteredCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button key={cat.id} className="group flex flex-col items-start gap-3 rounded-lg border border-[#1f2528]/10 bg-[#f9faf7] p-4 text-left transition hover:border-[#2f7867]/30 hover:bg-white">
                  <span className="grid h-10 w-10 place-items-center rounded-lg" style={{ color: cat.color, backgroundColor: cat.bg }}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#1f2528]">{cat.title}</p>
                    <p className="mt-0.5 text-xs leading-5 text-slate-500">{cat.description}</p>
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{cat.articleCount} articles</span>
                </button>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* ── FAQ ── */}
      <div className="mt-6">
        <SectionCard eyebrow="Common questions" title="Frequently Asked Questions">
          {filteredFaqs.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No FAQs match “{searchQuery}”.</p>
          ) : (
            <div className="divide-y divide-[#1f2528]/8">
              {filteredFaqs.map((faq) => {
                const open = openFaqId === faq.id;
                return (
                  <div key={faq.id} className="py-3 first:pt-0 last:pb-0">
                    <button onClick={() => setOpenFaqId(open ? null : faq.id)} className="flex w-full items-start justify-between gap-3 text-left">
                      <span>
                        <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#2f7867]">{faq.category}</span>
                        <span className="text-sm font-bold text-[#1f2528]">{faq.question}</span>
                      </span>
                      <ChevronDown className={cn("mt-1 h-4 w-4 shrink-0 text-slate-400 transition-transform", open && "rotate-180")} />
                    </button>
                    {open && <p className="mt-2 text-sm leading-6 text-slate-500">{faq.answer}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* ── Submit Support Ticket (demo only) ── */}
        <SectionCard eyebrow="Need more help" title="Submit a support ticket">
          {ticketSubmitted ? (
            <div className="flex items-center gap-3 rounded-lg bg-[#eaf7ef] px-4 py-4 text-sm font-bold text-[#2f7867]">
              <CheckCircle2 className="h-5 w-5 shrink-0" /> Ticket submitted! This is a demo — no backend is wired up yet, so nothing was sent.
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Subject</span>
                <input className="w-full rounded-lg border border-[#1f2528]/12 bg-[#f9faf7] px-4 py-2.5 text-sm text-[#1f2528] outline-none focus:border-[#2f7867]/50 focus:bg-white"
                  placeholder="Briefly describe the issue" value={ticketSubject} onChange={(e) => setTicketSubject(e.target.value)} />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Category</span>
                  <select className="w-full rounded-lg border border-[#1f2528]/12 bg-[#f9faf7] px-4 py-2.5 text-sm text-[#1f2528] outline-none focus:border-[#2f7867]/50 focus:bg-white"
                    value={ticketCategory} onChange={(e) => setTicketCategory(e.target.value)}>
                    {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Priority</span>
                  <select className="w-full rounded-lg border border-[#1f2528]/12 bg-[#f9faf7] px-4 py-2.5 text-sm text-[#1f2528] outline-none focus:border-[#2f7867]/50 focus:bg-white"
                    value={ticketPriority} onChange={(e) => setTicketPriority(e.target.value)}>
                    {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </label>
              </div>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Description</span>
                <textarea className="min-h-32 w-full resize-none rounded-lg border border-[#1f2528]/12 bg-[#f9faf7] p-4 text-sm leading-6 text-[#1f2528] outline-none focus:border-[#2f7867]/50 focus:bg-white"
                  placeholder="What happened? Steps to reproduce, if relevant." value={ticketDescription} onChange={(e) => setTicketDescription(e.target.value)} />
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-[#1f2528]/20 bg-[#f9faf7] px-3 py-2 text-xs font-bold text-slate-500 hover:border-[#2f7867]/40">
                  <Paperclip className="h-3.5 w-3.5" />
                  {ticketFileName || "Attach a screenshot (UI only)"}
                  <input type="file" className="hidden" onChange={(e) => setTicketFileName(e.target.files?.[0]?.name || null)} />
                </label>
                {ticketFileName && <button onClick={() => setTicketFileName(null)} className="text-xs font-bold text-slate-400 hover:text-[#1f2528]">Remove</button>}
              </div>
              <Button variant="primary" className="w-full" disabled={submittingTicket || !ticketSubject.trim() || !ticketDescription.trim()} onClick={submitTicket}>
                {submittingTicket ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {submittingTicket ? "Submitting..." : "Submit ticket"}
              </Button>
              <p className="text-center text-[11px] text-slate-400">Demo form — nothing is sent to a backend yet.</p>
            </div>
          )}
        </SectionCard>

        {/* ── Contact Support ── */}
        <SectionCard eyebrow="Talk to us" title="Contact Support">
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg bg-[#f9faf7] p-4">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#2f7867]" />
              <div>
                <p className="text-sm font-bold text-[#1f2528]">Email us</p>
                <p className="text-xs text-slate-500">support@postsync.app</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-[#f9faf7] p-4">
              <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#2f7867]" />
              <div>
                <p className="text-sm font-bold text-[#1f2528]">Live chat</p>
                <p className="text-xs text-slate-500">Mon–Fri, 9am–6pm IST</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-[#f9faf7] p-4">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#2f7867]" />
              <div>
                <p className="text-sm font-bold text-[#1f2528]">Average response time</p>
                <p className="text-xs text-slate-500">Under 4 hours on paid plans</p>
              </div>
            </div>
            <a href="#" className="flex items-center justify-between rounded-lg border border-[#1f2528]/10 px-4 py-3 text-sm font-bold text-[#1f2528] transition hover:bg-[#f9faf7]">
              Visit the community forum <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
            </a>
          </div>
        </SectionCard>
      </div>

      {/* ── My Tickets ── */}
      <div className="mt-6">
        <SectionCard eyebrow="Your history" title="My Tickets">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#1f2528]/8 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  <th className="pb-2 pr-4">Ticket</th>
                  <th className="pb-2 pr-4">Category</th>
                  <th className="pb-2 pr-4">Priority</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f2528]/6">
                {SAMPLE_TICKETS.map((t) => {
                  const s = STATUS_STYLES[t.status];
                  const StatusIcon = s.icon;
                  return (
                    <tr key={t.id}>
                      <td className="py-3 pr-4">
                        <p className="font-bold text-[#1f2528]">{t.subject}</p>
                        <p className="text-xs text-slate-400">{t.id}</p>
                      </td>
                      <td className="py-3 pr-4 text-slate-500">{t.category}</td>
                      <td className={cn("py-3 pr-4 font-bold capitalize", PRIORITY_STYLES[t.priority])}>{t.priority}</td>
                      <td className="py-3 pr-4">
                        <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold", s.className)}>
                          <StatusIcon className="h-3 w-3" /> {s.label}
                        </span>
                      </td>
                      <td className="py-3 text-slate-500">{t.updated}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>

      {/* ── System Status ── */}
      <div className="mt-6">
        <SectionCard eyebrow="Live status" title="System Status" action={<Badge className="border-[#2f7867]/20 bg-[#eaf7ef] text-[#2f7867]">All core systems normal</Badge>}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SYSTEM_STATUS.map((s) => {
              const style = SYSTEM_STATUS_STYLES[s.status];
              const Icon = style.icon;
              return (
                <div key={s.name} className="rounded-lg border border-[#1f2528]/10 bg-[#f9faf7] p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-[#1f2528]">{s.name}</p>
                    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold", style.className)}>
                      <Icon className="h-3 w-3" /> {style.label}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">{s.uptime} uptime (90 days)</p>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>

      {/* ── Feature Requests ── */}
      <div className="mt-6">
        <SectionCard eyebrow="Shape the roadmap" title="Feature Requests">
          <div className="space-y-2">
            {FEATURE_REQUESTS.map((fr) => {
              const style = FEATURE_STATUS_STYLES[fr.status];
              const isUp = upvoted.has(fr.id);
              return (
                <div key={fr.id} className="flex items-start gap-3 rounded-lg border border-[#1f2528]/10 bg-[#f9faf7] p-4">
                  <button onClick={() => toggleUpvote(fr.id)}
                    className={cn("flex flex-col items-center gap-0.5 rounded-lg border px-3 py-2 text-xs font-bold transition",
                      isUp ? "border-[#2f7867]/30 bg-[#eaf7ef] text-[#2f7867]" : "border-[#1f2528]/10 bg-white text-slate-500 hover:border-[#2f7867]/30")}>
                    <ThumbsUp className="h-3.5 w-3.5" />
                    {fr.votes + (isUp ? 1 : 0)}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-[#1f2528]">{fr.title}</p>
                      <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-bold", style.className)}>{style.label}</span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{fr.description}</p>
                    <span className="mt-1.5 inline-block text-[11px] font-bold uppercase tracking-wide text-slate-400">{fr.tag}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>

      {/* ── Release Notes ── */}
      <div className="mt-6">
        <SectionCard eyebrow="What's new" title="Release Notes">
          <div className="space-y-3">
            {RELEASE_NOTES.map((note, i) => {
              const Icon = note.icon;
              return (
                <div key={i} className="flex gap-3 rounded-lg border border-[#1f2528]/10 bg-[#f9faf7] p-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg" style={{ color: note.color, backgroundColor: note.bg }}>
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-400">{note.date}</span>
                      <Badge className="border-transparent" style={{ color: note.color, backgroundColor: note.bg }}>{note.tag}</Badge>
                    </div>
                    <p className="mt-1 text-sm font-bold text-[#1f2528]">{note.title}</p>
                    <p className="mt-0.5 text-xs leading-5 text-slate-500">{note.copy}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>
    </motion.section>
  );
}
