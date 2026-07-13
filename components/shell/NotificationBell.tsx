"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, X, Loader2, FileText, MessageSquareWarning, Archive, UserX } from "lucide-react";

interface PendingInvite {
  id: string;
  token: string;
  role: string;
  created_at: string;
  expires_at: string;
  invited_by_name?: string | null;
  invited_by_email?: string | null;
  workspace: { id: string; name: string } | null;
}

interface WorkspaceNotification {
  id: string;
  workspace_id: string;
  type: "report_submitted" | "report_changes_requested" | "report_archived" | "invite_rejected";
  title: string;
  body: string;
  entity_type: string;
  entity_id: string | null;
  is_read: boolean;
  created_at: string;
}

const NOTIFICATION_ICON: Record<WorkspaceNotification["type"], typeof FileText> = {
  report_submitted: FileText,
  report_changes_requested: MessageSquareWarning,
  report_archived: Archive,
  invite_rejected: UserX,
};

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [notifications, setNotifications] = useState<WorkspaceNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const unreadCount = invites.length + notifications.filter((n) => !n.is_read).length;

  const loadAll = async () => {
    try {
      const [invitesRes, notifsRes] = await Promise.all([
        fetch("/api/workspace/invite/pending"),
        fetch("/api/notifications"),
      ]);
      const invitesData = await invitesRes.json();
      if (invitesRes.ok) setInvites(invitesData.invites || []);
      const notifsData = await notifsRes.json();
      if (notifsRes.ok) setNotifications(notifsData.notifications || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // Re-check periodically so a fresh invite/notification shows up without a manual refresh
    const interval = setInterval(loadAll, 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAccept = async (invite: PendingInvite) => {
    setActingId(invite.id);
    try {
      const res = await fetch("/api/workspace/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: invite.token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to accept invite");
      setInvites((prev) => prev.filter((i) => i.id !== invite.id));
      setOpen(false);
      router.push("/team");
      router.refresh();
    } catch {
      // leave the invite in the list; the person can retry
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (invite: PendingInvite) => {
    setActingId(invite.id);
    try {
      const res = await fetch("/api/workspace/invite/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: invite.token }),
      });
      if (res.ok) {
        setInvites((prev) => prev.filter((i) => i.id !== invite.id));
      }
    } finally {
      setActingId(null);
    }
  };

  const handleOpenNotification = async (n: WorkspaceNotification) => {
    if (!n.is_read) {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
      void fetch(`/api/notifications/${n.id}/read`, { method: "POST" }).catch(() => {});
    }
    setOpen(false);
    // "Changes requested" is aimed at the Analyst who needs to fix and
    // resubmit — send them straight to Team Performance with that
    // report's exact date range preloaded so they land in an editable
    // state, not just a read-only view. Every other report notification
    // (submitted/resubmitted/archived) is for Owner/Manager oversight —
    // send them straight to that report's entry in the Reports list.
    if (n.type === "invite_rejected") {
      router.push("/team");
    } else if (n.type === "report_changes_requested" && n.entity_id) {
      router.push(`/analytics?tab=team&editReportId=${n.entity_id}`);
    } else if (n.entity_id) {
      router.push(`/analytics?tab=reports&reportId=${n.entity_id}`);
    } else {
      router.push("/analytics?tab=reports");
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#1f2528]/12 hover:bg-[#f4f6f0] transition"
      >
        <Bell className="h-[18px] w-[18px] text-[#5a656c]" />
        {unreadCount > 0 && (
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#d05945]" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-[60] w-80 rounded-2xl border border-[#1f2528]/8 bg-white shadow-[0_16px_40px_rgba(31,37,40,0.14)] overflow-hidden">
          <div className="border-b border-[#1f2528]/6 px-4 py-3">
            <p className="text-sm font-bold text-[#1f2528]">Notifications</p>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-[#5a656c]" />
              </div>
            ) : invites.length === 0 && notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs font-semibold text-[#5a656c]">
                Nothing new
              </p>
            ) : (
              <>
                {invites.map((invite) => (
                  <div key={invite.id} className="border-b border-[#1f2528]/6 px-4 py-3 last:border-0">
                    <p className="text-sm text-[#1f2528]">
                      <span className="font-bold">{invite.invited_by_name || invite.invited_by_email || "Someone"}</span>
                      {invite.invited_by_email && (
                        <span className="text-xs text-[#5a656c]"> ({invite.invited_by_email})</span>
                      )}{" "}
                      invited you to{" "}
                      <span className="font-bold">{invite.workspace?.name || "a workspace"}</span>{" "}
                      as <span className="font-bold">{invite.role}</span>
                    </p>
                    <div className="mt-2.5 flex gap-2">
                      <button
                        onClick={() => handleAccept(invite)}
                        disabled={actingId === invite.id}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#2f7867] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#26604f] disabled:opacity-50 transition-colors"
                      >
                        {actingId === invite.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        Accept
                      </button>
                      <button
                        onClick={() => handleReject(invite)}
                        disabled={actingId === invite.id}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#1f2528]/12 px-3 py-1.5 text-xs font-bold text-[#5a656c] hover:bg-[#f4f6f0] disabled:opacity-50 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}

                {notifications.map((n) => {
                  const Icon = NOTIFICATION_ICON[n.type] || FileText;
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleOpenNotification(n)}
                      className="flex w-full items-start gap-2.5 border-b border-[#1f2528]/6 px-4 py-3 text-left last:border-0 hover:bg-[#f9faf7]"
                    >
                      <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#eaf3ed] text-[#2f7867]">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 text-sm font-bold text-[#1f2528]">
                          {n.title}
                          {!n.is_read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#d05945]" />}
                        </p>
                        <p className="mt-0.5 text-xs leading-5 text-[#5a656c]">{n.body}</p>
                        <p className="mt-1 text-[10px] text-slate-400">{new Date(n.created_at).toLocaleString()}</p>
                      </div>
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}