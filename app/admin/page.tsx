"use client";

import { useState, useEffect, useMemo, useSyncExternalStore } from "react";
import { 
  ShieldAlert, 
  Lock, 
  Mail, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Database, 
  Activity, 
  Send,
  RefreshCw,
  LogOut,
  Layers,
  Sparkles,
  LifeBuoy,
  Cpu,
  FileText,
  Settings,
  Trash2,
  ChevronRight,
  MessageSquare,
  BadgeAlert,
  ArrowLeft,
  XCircle,
  HelpCircle,
  Image as ImageIcon
} from "lucide-react";
import { BrandMark } from "@/components/marketing/BrandMark";

interface TicketMessage {
  sender: "user" | "admin";
  text: string;
  time: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  description?: string | null;
  status: string;
  updated?: string | null;
  images?: string[] | null;
  messages: TicketMessage[];
  typing_status?: { user?: boolean; admin?: boolean } | null;
  user_name?: string | null;
  user_email?: string | null;
}

interface AutomationLogRow {
  id: string;
  created_at: string;
  user_id: string;
  trend_title?: string | null;
  status: string;
  approval_email?: string | null;
}

interface ScheduledPostRow {
  id: string;
  scheduled_at: string;
  platforms?: string[] | null;
  caption?: string | null;
  is_approved?: boolean | null;
}

interface AdminDataResponse {
  stats: { automations: number; logs: number; posts: number };
  tickets?: SupportTicket[];
  logs: AutomationLogRow[];
  posts: ScheduledPostRow[];
  chatSupportEnabled?: boolean;
  error?: string;
}

type CronResult = Record<string, unknown>;

// Fallback Mock tickets with description and replies history
const INITIAL_TICKETS: SupportTicket[] = [];

/**
 * Admin credentials are verified server-side against env vars and are never
 * present in this bundle. Authentication state lives in an httpOnly cookie set
 * by POST /api/admin/login, which this component cannot read by design.
 *
 * The sessionStorage key below is a non-sensitive UI hint only — it tells the
 * component which view to render on reload. It grants no access: every admin API
 * call is authorised by the cookie, and a stale hint simply yields a 401 that
 * sends the operator back to the login form.
 */
const SESSION_KEY = "admin_session";

const sessionListeners = new Set<() => void>();

function emitAdminSessionChange() {
  sessionListeners.forEach((listener) => listener());
}

// Snapshot is a primitive so useSyncExternalStore can compare it by value.
function getAdminSessionSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(SESSION_KEY) === "active" ? "active" : null;
}

function getAdminSessionServerSnapshot(): string | null {
  return null;
}

function subscribeToAdminSession(onStoreChange: () => void) {
  sessionListeners.add(onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    sessionListeners.delete(onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function saveAdminSession() {
  window.sessionStorage.setItem(SESSION_KEY, "active");
  emitAdminSessionChange();
}

function clearAdminSession() {
  window.sessionStorage.clear();
  emitAdminSessionChange();
}

function toErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error && err.message ? err.message : fallback;
}

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The admin session lives in sessionStorage (an external store), so it is read
  // through useSyncExternalStore rather than copied into state from an effect.
  const sessionSnapshot = useSyncExternalStore(
    subscribeToAdminSession,
    getAdminSessionSnapshot,
    getAdminSessionServerSnapshot
  );
  const isLoggedIn = sessionSnapshot === "active";
  // Shown in the sidebar only. The authoritative identity lives server-side.
  const activeEmail = email;

  // Views control: default/start with "support" as requested!
  const [adminView, setAdminView] = useState<"support" | "automation" | "queue" | "settings">("support");

  // Support Tickets State
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_TICKETS);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [chatSupportEnabled, setChatSupportEnabled] = useState(true);

  // System Database Data
  const [data, setData] = useState<{
    stats: { automations: number; logs: number; posts: number };
    logs: AutomationLogRow[];
    posts: ScheduledPostRow[];
  } | null>(null);

  const [triggeringCron, setTriggeringCron] = useState(false);
  const [cronResult, setCronResult] = useState<CronResult | null>(null);
  const [fetchingData, setFetchingData] = useState(false);

  const [typingTimeout, setTypingTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [isTypingSent, setIsTypingSent] = useState(false);

  const fetchAdminData = async () => {
    setFetchingData(true);
    try {
      // Authorised by the httpOnly admin session cookie — no credentials in the body.
      const res = await fetch("/api/admin/data", { method: "POST" });
      const resData: AdminDataResponse = await res.json();
      if (res.status === 401) {
        // Session expired or was never valid — drop back to the login form.
        clearAdminSession();
        throw new Error("Your administrative session has expired. Please sign in again.");
      }
      if (!res.ok) throw new Error(resData.error || "Failed to retrieve system status");
      setData(resData);
      if (resData.chatSupportEnabled !== undefined) {
        setChatSupportEnabled(resData.chatSupportEnabled);
      }

      // Load tickets from database if available (or default to initial mock fallback list)
      if (resData.tickets && resData.tickets.length > 0) {
        setTickets(resData.tickets);
      } else {
        setTickets(INITIAL_TICKETS);
      }
    } catch (err: unknown) {
      setError(toErrorMessage(err, "Failed to fetch database data"));
    } finally {
      setFetchingData(false);
    }
  };

  const handleToggleChatSupport = async (enabled: boolean) => {
    try {
      setChatSupportEnabled(enabled);
      const res = await fetch("/api/admin/toggle-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled })
      });
      if (!res.ok) throw new Error("Failed to toggle support chat");
      await fetchAdminData();
    } catch (err) {
      console.error(err);
      setChatSupportEnabled(!enabled); // rollback
    }
  };

  // Poll admin data while an admin session is active
  useEffect(() => {
    if (!isLoggedIn) return;

    const poll = () => {
      fetchAdminData();
    };

    // The first poll is scheduled rather than run inline so that no state
    // update happens synchronously while the effect is committing.
    const initialPoll = setTimeout(poll, 0);
    const interval = setInterval(poll, 2000); // Poll every 2 seconds

    return () => {
      clearTimeout(initialPoll);
      clearInterval(interval);
    };
  }, [isLoggedIn]);

  const sendTypingStatus = async (ticketId: string, isTyping: boolean) => {
    if (String(ticketId).startsWith("TCK-")) return;
    try {
      await fetch("/api/support/typing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, role: "admin", isTyping })
      });
    } catch (e) {
      console.warn("Failed to update admin typing indicator", e);
    }
  };

  const handleAdminTyping = (text: string) => {
    setReplyText(text);
    if (!selectedTicketId) return;

    if (text.length > 0) {
      if (!isTypingSent) {
        setIsTypingSent(true);
        sendTypingStatus(selectedTicketId, true);
      }
      if (typingTimeout) clearTimeout(typingTimeout);
      const t = setTimeout(() => {
        sendTypingStatus(selectedTicketId, false);
        setIsTypingSent(false);
      }, 3000);
      setTypingTimeout(t);
    } else {
      if (typingTimeout) clearTimeout(typingTimeout);
      sendTypingStatus(selectedTicketId, false);
      setIsTypingSent(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Credentials are verified server-side; on success the server sets an
      // httpOnly session cookie that authorises subsequent admin API calls.
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Invalid administrative credentials.");
        return;
      }

      setPassword("");
      saveAdminSession();
      await fetchAdminData();
    } catch (err: unknown) {
      setError(toErrorMessage(err, "Unable to reach the authentication service."));
    } finally {
      setLoading(false);
    }
  };

  const triggerCronJob = async () => {
    setTriggeringCron(true);
    setCronResult(null);
    try {
      const res = await fetch("/api/automation/trigger", {
        method: "POST"
      });
      const result: CronResult = await res.json();
      setCronResult(result);
      await fetchAdminData();
    } catch (err: unknown) {
      setCronResult({ error: toErrorMessage(err, "Failed to trigger cron trigger endpoint") });
    } finally {
      setTriggeringCron(false);
    }
  };

  const handleSendReply = async (ticketId: string) => {
    if (!replyText.trim()) return;
    const activeTicket = tickets.find(t => t.id === ticketId);
    if (!activeTicket || activeTicket.status === "resolved") return;

    if (typingTimeout) clearTimeout(typingTimeout);
    sendTypingStatus(ticketId, false);

    const newReply: TicketMessage = { sender: "admin", text: replyText, time: new Date().toLocaleString() };
    const updatedMessages = [...(activeTicket.messages || []), newReply];
    const newStatus = activeTicket.status === "open" ? "in_progress" : activeTicket.status;

    // Check if it's a hardcoded static mock ticket fallback
    if (String(ticketId).startsWith("TCK-")) {
      setTickets(prevTickets => 
        prevTickets.map(t => {
          if (t.id === ticketId) {
            return {
              ...t,
              status: newStatus,
              updated: new Date().toISOString().split("T")[0],
              messages: updatedMessages
            };
          }
          return t;
        })
      );
      setReplyText("");
      return;
    }

    try {
      const res = await fetch("/api/admin/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          ticketId,
          messages: updatedMessages,
          status: newStatus
        })
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to update reply on database");
      
      setReplyText("");
      await fetchAdminData();
    } catch (err: unknown) {
      console.warn("Could not save admin reply to DB, updating client state fallback.", err);
      setTickets(prevTickets => 
        prevTickets.map(t => {
          if (t.id === ticketId) {
            return {
              ...t,
              status: newStatus,
              updated: new Date().toISOString().split("T")[0],
              messages: updatedMessages
            };
          }
          return t;
        })
      );
      setReplyText("");
    }
  };

  const handleUpdateStatus = async (ticketId: string, status: string) => {
    const activeTicket = tickets.find(t => t.id === ticketId);
    if (!activeTicket) return;

    if (String(ticketId).startsWith("TCK-")) {
      setTickets(prevTickets =>
        prevTickets.map(t => (t.id === ticketId ? { ...t, status } : t))
      );
      return;
    }

    try {
      const res = await fetch("/api/admin/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          ticketId,
          messages: activeTicket.messages || [],
          status
        })
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to update status on database");
      await fetchAdminData();
    } catch (err) {
      console.warn("Could not update status on DB, updating client state fallback.", err);
      setTickets(prevTickets =>
        prevTickets.map(t => (t.id === ticketId ? { ...t, status } : t))
      );
    }
  };

  const handleLogout = async () => {
    // Clear the local UI hint first so the form returns immediately, then revoke
    // the server-side cookie. A failed revoke must not strand the operator in
    // a logged-in-looking UI.
    clearAdminSession();
    setData(null);
    setCronResult(null);
    setEmail("");
    setPassword("");
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch (err: unknown) {
      console.error("Admin logout error:", err);
    }
  };

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  // Status rendering helper values
  const STATUS_STYLES: Record<string, { label: string; className: string }> = {
    open: { label: "Open", className: "bg-rose-50 border-rose-200 text-rose-700" },
    in_progress: { label: "In Progress", className: "bg-amber-50 border-amber-200 text-amber-700" },
    resolved: { label: "Resolved", className: "bg-emerald-50 border-emerald-200 text-emerald-700" },
    closed: { label: "Closed", className: "bg-slate-100 border-slate-200 text-slate-500" }
  };

  const PRIORITY_STYLES: Record<string, string> = {
    high: "text-rose-600",
    medium: "text-amber-600",
    low: "text-sky-600"
  };

  if (!isLoggedIn) {
    return (
      <div className="relative min-h-screen bg-[#f6f7f1] text-[#1f2528] flex items-center justify-center p-4">
        {/* Background Gradients */}
        <div className="pointer-events-none fixed inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(79,70,229,0.08),transparent_34%),linear-gradient(315deg,rgba(220,38,38,0.06),transparent_30%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(31,37,40,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(31,37,40,0.045)_1px,transparent_1px)] bg-[size:72px_72px] opacity-50" />
        </div>

        <div className="relative z-10 w-full max-w-md bg-white/80 border border-slate-200/80 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] backdrop-blur-md p-8">
          <div className="flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800">Postelligence</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">System Control Room</p>
          </div>

          <form onSubmit={handleLogin} className="mt-8 space-y-4">
            {error && (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs font-bold text-rose-600">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Mail ID / Username</label>
              <div className="relative mt-2">
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@domain.com"
                  className="block w-full rounded-xl border border-slate-200 bg-white/50 pl-10 pr-4 py-2.5 text-xs font-bold text-[#1f2528] focus:border-indigo-500 focus:bg-white focus:outline-none transition shadow-sm"
                />
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Master Password</label>
              <div className="relative mt-2">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-xl border border-slate-200 bg-white/50 pl-10 pr-4 py-2.5 text-xs font-bold text-[#1f2528] focus:border-indigo-500 focus:bg-white focus:outline-none transition shadow-sm"
                />
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs py-3 transition shadow flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Authenticate Access
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#f6f7f1] text-[#1f2528]">
      {/* Background Gradients */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(79,70,229,0.06),transparent_34%),linear-gradient(315deg,rgba(220,38,38,0.05),transparent_30%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(31,37,40,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(31,37,40,0.045)_1px,transparent_1px)] bg-[size:72px_72px] opacity-40" />
      </div>

      <div className="relative flex min-h-screen p-4 lg:p-6 gap-6">
        
        {/* FIXED ADMIN PANEL SIDEBAR */}
        <aside className="fixed bottom-6 left-6 top-6 z-40 flex w-[240px] flex-col rounded-[24px] border border-[#1f2528]/8 bg-white/70 p-4 backdrop-blur-md shadow-[0_8px_30px_rgba(31,37,40,0.02)]">
          {/* Header branding */}
          <div className="flex h-12 items-center px-1">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm">
                P
              </div>
              <div>
                <h2 className="text-xs font-black tracking-tight text-slate-800">Postelligence</h2>
                <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest leading-none mt-0.5">Control Panel</p>
              </div>
            </div>
          </div>

          {/* Navigation Links - starting with Support */}
          <nav className="mt-6 flex-1 space-y-1">
            <button
              onClick={() => { setAdminView("support"); setSelectedTicketId(null); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                adminView === "support"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              }`}
            >
              <LifeBuoy className="h-4 w-4" />
              Support Tickets
            </button>
            <button
              onClick={() => setAdminView("automation")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                adminView === "automation"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              }`}
            >
              <Cpu className="h-4 w-4" />
              Scheduler Engine
            </button>
            <button
              onClick={() => setAdminView("queue")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                adminView === "queue"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              }`}
            >
              <FileText className="h-4 w-4" />
              Scheduled Queue
            </button>
            <button
              onClick={() => setAdminView("settings")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                adminView === "settings"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              }`}
            >
              <Settings className="h-4 w-4" />
              Configurations
            </button>
          </nav>

          {/* Sidebar Footer User Details */}
          <div className="border-t border-slate-100 pt-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 px-1">
              <div className="h-7 w-7 rounded-lg bg-indigo-50 border border-indigo-150 flex items-center justify-center text-[10px] font-black text-indigo-700">
                AD
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-slate-800 truncate leading-none">System Admin</p>
                <p className="text-[9px] text-slate-400 truncate mt-0.5">{activeEmail}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full mt-1 py-2 bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100/50 transition font-bold text-[10px] rounded-lg flex items-center justify-center gap-1.5"
            >
              <LogOut className="h-3 w-3" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT AREA CONTAINER (indented for fixed sidebar) */}
        <main className="flex-1 pl-[260px] space-y-6 min-h-screen pb-24">
          
          {/* Header Bar */}
          <div className="flex items-center justify-between bg-white border border-slate-200/80 p-4 rounded-2xl shadow-sm">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Control Panel</p>
              <h1 className="text-lg font-black text-slate-800 capitalize leading-none mt-0.5">{adminView} View</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchAdminData()}
                disabled={fetchingData}
                className="p-2 text-slate-500 hover:bg-slate-50 rounded-xl transition border border-slate-200 flex items-center justify-center"
                title="Sync Database Stats"
              >
                <RefreshCw className={`h-4 w-4 ${fetchingData ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* VIEW: SUPPORT TICKETS (Primary/Default view) */}
          {adminView === "support" && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              
              {/* Tickets List */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-50">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">All Support Tickets</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Chat Support</span>
                    <button
                      onClick={() => handleToggleChatSupport(!chatSupportEnabled)}
                      className={`relative inline-flex h-4.5 w-8.5 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        chatSupportEnabled ? "bg-emerald-600" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          chatSupportEnabled ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
                <div className="divide-y divide-slate-100 h-[500px] overflow-y-auto pr-1">
                  {tickets.map(t => {
                    const statusVal = STATUS_STYLES[t.status] || { label: t.status, className: "bg-slate-50 text-slate-500" };
                    return (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTicketId(t.id)}
                        className={`w-full text-left p-3 rounded-xl transition flex flex-col gap-2 mt-1.5 first:mt-0 ${
                          selectedTicketId === t.id ? "bg-slate-50 border border-slate-250/70" : "hover:bg-slate-50/50 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-indigo-650 truncate max-w-[140px]">{t.id}</span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wide border ${statusVal.className}`}>
                            {statusVal.label}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-700 leading-snug line-clamp-2">{t.subject}</h4>
                        <div className="flex flex-col text-[9px] text-slate-400 font-bold gap-0.5 border-t border-slate-50 pt-1.5 mt-0.5">
                          <span className="text-slate-600">User: {t.user_name || "User"}</span>
                          <span className="text-[8px] font-mono leading-none truncate">{t.user_email || "unknown@domain.com"}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ticket Conversations Manager */}
              <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col justify-between min-h-[550px]">
                {selectedTicket ? (
                  <div className="flex flex-col h-full justify-between">
                    <div className="space-y-4">
                      {/* Ticket Info Header */}
                      <div className="border-b border-slate-100 pb-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <h2 className="text-sm font-black text-slate-800 leading-snug">{selectedTicket.subject}</h2>
                          <div>
                            {selectedTicket.status === "resolved" ? (
                              <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wide border bg-emerald-50 border-emerald-200 text-emerald-700">
                                Resolved
                              </span>
                            ) : (
                              <button
                                onClick={() => handleUpdateStatus(selectedTicket.id, "resolved")}
                                className="px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wide bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm"
                              >
                                Mark as Resolved
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 border-t border-slate-50 pt-2 mt-1">
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-400 font-bold">
                            <span className="truncate max-w-[150px]">ID: {selectedTicket.id}</span>
                            <span>Updated: {selectedTicket.updated}</span>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[10px] text-indigo-650 font-bold">
                            <span>User: {selectedTicket.user_name || "User"}</span>
                            <span className="font-mono text-slate-500">{selectedTicket.user_email || "unknown@domain.com"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Attached Screenshot Images Display */}
                      {selectedTicket.images && selectedTicket.images.length > 0 && (
                        <div className="space-y-1.5 pb-2">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide">Screenshots ({selectedTicket.images.length})</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {selectedTicket.images.map((img: string, idx: number) => (
                              <a key={idx} href={img} target="_blank" rel="noreferrer" className="relative group">
                                <img
                                  src={img}
                                  alt={`Screenshot Attachment ${idx + 1}`}
                                  className="h-14 w-14 object-cover rounded-xl border border-slate-200 shadow-sm transition hover:scale-105"
                                />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Messages Thread */}
                      <div className="space-y-3 h-[250px] overflow-y-auto pr-1 leading-normal border-t border-slate-50 pt-3">
                        {selectedTicket.messages.map((m: TicketMessage, idx: number) => {
                          const isAdmin = m.sender === "admin";
                          return (
                            <div key={idx} className={`flex flex-col max-w-[85%] ${isAdmin ? "ml-auto items-end" : "mr-auto items-start"}`}>
                              <div className={`p-3 rounded-2xl text-xs font-medium leading-relaxed border ${
                                isAdmin
                                  ? "bg-indigo-50 border-indigo-150 text-indigo-800 rounded-tr-none"
                                  : "bg-slate-50 border-slate-200 text-slate-700 rounded-tl-none"
                              }`}>
                                <p>{m.text}</p>
                                <span className="block text-[8px] text-slate-400 mt-1 text-right font-medium leading-none">{m.time}</span>
                              </div>
                            </div>
                          );
                        })}

                        {/* typing indicator */}
                        {selectedTicket.typing_status?.user && (
                          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold pl-2 py-1 select-none animate-pulse">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-450 animate-bounce delay-0" />
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-450 animate-bounce [animation-delay:0.2s]" />
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-450 animate-bounce [animation-delay:0.4s]" />
                            <span className="ml-1 text-[9px] text-slate-400 italic">User is typing...</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Reply Input Box */}
                    <div className="border-t border-slate-100 pt-4 flex gap-2 items-center">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => handleAdminTyping(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && selectedTicket.status !== "resolved") handleSendReply(selectedTicket.id);
                        }}
                        placeholder={selectedTicket.status === "resolved" ? "This ticket has been resolved." : "Write support reply message and hit Send..."}
                        disabled={selectedTicket.status === "resolved"}
                        className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs font-bold text-[#1f2528] focus:bg-white focus:border-indigo-500 focus:outline-none transition shadow-sm disabled:opacity-50"
                      />
                      <button
                        onClick={() => handleSendReply(selectedTicket.id)}
                        disabled={selectedTicket.status === "resolved" || !replyText.trim()}
                        className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center justify-center shadow disabled:opacity-50"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-3 py-12">
                    <div className="h-12 w-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                      <HelpCircle className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-650 uppercase tracking-wide">No Ticket Selected</h4>
                      <p className="text-[10px] text-slate-400 font-bold max-w-[200px] mt-1 leading-normal">
                        Select a ticket on the left panel to review message threads, send answers, and change statuses.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW: SCHEDULER ENGINE */}
          {adminView === "automation" && (
            <div className="space-y-6">
              {/* Stats & Actions here... */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-650" />
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">System Actions</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-3">
                    <h3 className="text-xs font-bold text-slate-700">Trigger Global Scheduler Cron</h3>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      Manually invoke the automation engine. This will evaluate all user schedules and run curation scripts for matching time blocks.
                    </p>
                    <button
                      onClick={triggerCronJob}
                      disabled={triggeringCron}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition disabled:opacity-60 shadow"
                    >
                      {triggeringCron ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      Trigger Engine Now
                    </button>
                  </div>

                  <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-2">
                    <h3 className="text-xs font-bold text-slate-700">Cron Output Log</h3>
                    <div className="bg-zinc-950 text-zinc-400 font-mono text-[9px] p-3 rounded-lg h-[92px] overflow-y-auto border border-zinc-900 leading-normal">
                      {cronResult ? (
                        <pre className="whitespace-pre-wrap">{JSON.stringify(cronResult, null, 2)}</pre>
                      ) : (
                        <span className="text-zinc-600 italic">{"// Waiting for cron execution trigger..."}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Logs Table */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 bg-slate-50/40 p-4 flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">System Automation Runs</h3>
                </div>
                <div className="p-4 overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        <th className="py-2 pr-4">Created At</th>
                        <th className="py-2 pr-4">User ID</th>
                        <th className="py-2 pr-4">Trend Title</th>
                        <th className="py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-xs font-bold text-slate-650">
                      {data?.logs && data.logs.length > 0 ? (
                        data.logs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/50">
                            <td className="py-2.5 pr-4 text-slate-400 text-[10px] font-mono whitespace-nowrap">
                              {new Date(log.created_at).toLocaleString()}
                            </td>
                            <td className="py-2.5 pr-4 text-[10px] font-mono text-indigo-650 truncate max-w-[120px]" title={log.user_id}>
                              {log.user_id}
                            </td>
                            <td className="py-2.5 pr-4 truncate max-w-[300px]" title={log.trend_title ?? undefined}>
                              {log.trend_title || <span className="text-slate-300 italic">None</span>}
                            </td>
                            <td className="py-2.5 whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wide border ${
                                  log.status === "completed"
                                    ? "bg-emerald-50 border-emerald-150 text-emerald-600"
                                    : log.status === "pending"
                                    ? "bg-amber-50 border-amber-150 text-amber-600"
                                    : "bg-rose-50 border-rose-150 text-rose-600"
                                }`}
                              >
                                {log.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-400 italic">
                            No automation logs found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: SCHEDULED QUEUE */}
          {adminView === "queue" && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50/40 p-4 flex items-center justify-between">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Scheduled Queue Logs</h3>
              </div>
              <div className="p-4 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      <th className="py-2 pr-4">Scheduled At</th>
                      <th className="py-2 pr-4">Platforms</th>
                      <th className="py-2 pr-4">Caption Preview</th>
                      <th className="py-2">Approved</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs font-bold text-slate-650">
                    {data?.posts && data.posts.length > 0 ? (
                      data.posts.map((post) => (
                        <tr key={post.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 pr-4 text-slate-400 text-[10px] font-mono whitespace-nowrap">
                            {new Date(post.scheduled_at).toLocaleString()}
                          </td>
                          <td className="py-2.5 pr-4 whitespace-nowrap">
                            <div className="flex gap-1">
                              {post.platforms?.map((p: string) => (
                                <span key={p} className="px-1.5 py-0.5 rounded bg-slate-100 text-[9px] font-bold text-slate-500 uppercase">
                                  {p}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-2.5 pr-4 truncate max-w-[320px]" title={post.caption ?? undefined}>
                            {post.caption}
                          </td>
                          <td className="py-2.5 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wide border ${
                                post.is_approved
                                  ? "bg-emerald-50 border-emerald-150 text-emerald-600"
                                  : "bg-amber-50 border-amber-150 text-amber-600"
                              }`}
                            >
                              {post.is_approved ? "Approved" : "Pending"}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400 italic">
                          No scheduled posts queue found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW: CONFIGURATIONS */}
          {adminView === "settings" && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50/40 p-4 flex items-center justify-between">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Active User configurations</h3>
              </div>
              <div className="p-4 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      <th className="py-2 pr-4">User ID</th>
                      <th className="py-2 pr-4">Timezone</th>
                      <th className="py-2 pr-4">Schedule</th>
                      <th className="py-2 pr-4">Approval Email</th>
                      <th className="py-2">Engine Mode</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs font-bold text-slate-650">
                    {data?.logs && data.logs.length > 0 ? (
                      data.logs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 pr-4 text-[10px] font-mono text-slate-700 truncate max-w-[150px]" title={log.user_id}>
                            {log.user_id}
                          </td>
                          <td className="py-2.5 pr-4 text-slate-500 whitespace-nowrap">UTC / Local User</td>
                          <td className="py-2.5 pr-4 text-slate-500 capitalize">Daily Scheduler</td>
                          <td className="py-2.5 pr-4 text-indigo-650 truncate max-w-[150px]">{log.approval_email || "Active User Email"}</td>
                          <td className="py-2.5 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-150 text-indigo-700 text-[9px] font-black uppercase tracking-wide">
                              Automatic
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                          No active user configurations retrieved.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
