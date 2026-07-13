"use client";

import type { WorkspaceActivityLog } from "@/lib/types";

interface Props {
  logs: (WorkspaceActivityLog & { label: string })[];
  loading?: boolean;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function ActivityFeed({ logs, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start gap-3 animate-pulse">
            <div className="h-8 w-8 rounded-full bg-gray-200 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!logs.length) {
    return (
      <div className="text-center py-10 text-gray-400 text-sm">
        No activity yet.
      </div>
    );
  }

  return (
    <ol className="space-y-4">
      {logs.map((log) => {
        const initials = log.user_name
          ? log.user_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
          : "??";

        return (
          <li key={log.id} className="flex items-start gap-3">
            {/* Avatar */}
            {log.user_avatar ? (
              <img
                src={log.user_avatar}
                alt={log.user_name}
                className="h-8 w-8 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                {initials}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700">{log.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{timeAgo(log.created_at)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}