"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Loader2, Rocket, XCircle, CalendarDays, List } from "lucide-react";
import type { WorkspaceDraft, WorkspaceRole } from "@/lib/types";
import TeamMiniCalendar from "@/components/workspace/TeamMiniCalendar";

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} · ${hour}:${m} ${ampm}`;
}

export default function TeamScheduleClient({ workspaceId, currentRole }: { workspaceId: string; currentRole: WorkspaceRole }) {
  const router = useRouter();
  const [mode, setMode] = useState<"calendar" | "list">("calendar");
  const [view, setView] = useState<"upcoming" | "published">("upcoming");
  const [drafts, setDrafts] = useState<WorkspaceDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== "list") return;
    let cancelled = false;
    setLoading(true);
    const status = view === "upcoming" ? "scheduled" : "published";
    (async () => {
      try {
        const res = await fetch(`/api/workspace/drafts?status=${status}`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data.error || "Failed to load schedule.");
        const sorted = [...(data.drafts || [])].sort((a, b) => {
          const ta = a.scheduled_time ? new Date(a.scheduled_time).getTime() : 0;
          const tb = b.scheduled_time ? new Date(b.scheduled_time).getTime() : 0;
          return view === "upcoming" ? ta - tb : tb - ta;
        });
        setDrafts(sorted);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load schedule.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [workspaceId, view, mode]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm text-blue-700 flex items-start gap-2">
        <CalendarClock className="h-4 w-4 mt-0.5 shrink-0" />
        <p>
          This is the workspace's own schedule — posts a Manager or Owner has scheduled for the team's connected
          accounts. Your personal Calendar is separate and unaffected.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex rounded-xl bg-gray-100 p-1 w-fit">
          <button
            onClick={() => setMode("calendar")}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
              mode === "calendar" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <CalendarDays className="h-3.5 w-3.5" /> Calendar
          </button>
          <button
            onClick={() => setMode("list")}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
              mode === "list" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <List className="h-3.5 w-3.5" /> List
          </button>
        </div>

        {mode === "list" && (
          <div className="flex rounded-xl bg-gray-100 p-1 w-fit">
            {(["upcoming", "published"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all capitalize ${
                  view === v ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        )}
      </div>

      {mode === "calendar" ? (
        <TeamMiniCalendar workspaceId={workspaceId} currentRole={currentRole} />
      ) : error ? (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      ) : loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-8 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading...
        </div>
      ) : drafts.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-400">
          {view === "upcoming" ? "Nothing scheduled yet." : "Nothing published yet."}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
          {drafts.map((d) => (
            <button
              key={d.id}
              onClick={() => router.push(`/drafts/workspace/${d.id}`)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{d.title || "Untitled Draft"}</p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {d.platforms.map((p) => (
                    <span key={p} className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5 capitalize">{p}</span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4 text-sm text-gray-500">
                {d.status === "published" ? <Rocket className="h-3.5 w-3.5 text-green-500" /> : <CalendarClock className="h-3.5 w-3.5 text-blue-500" />}
                {formatDateTime(d.scheduled_time)}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}