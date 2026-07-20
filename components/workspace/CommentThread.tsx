"use client";

import { useEffect, useRef, useState } from "react";
import type { WorkspaceDraftComment } from "@/types";

interface Props {
  draftId: string;
  comments: WorkspaceDraftComment[];
  canComment: boolean;
  onCommentAdded: (comment: WorkspaceDraftComment) => void;
}

const POLL_MS = 5000;

function timeAgo(dateStr: string): string {
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function CommentThread({ draftId, comments, canComment, onCommentAdded }: Props) {
  const [content, setContent]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [liveComments, setLiveComments] = useState(comments);

  const listRef      = useRef<HTMLDivElement>(null);
  const isPollingRef  = useRef(false);

  // Keep local list in sync if the parent's comments prop changes
  // (e.g. after the current user's own comment is appended upstream).
  // Adjusting during render rather than in an effect avoids painting one
  // frame of the stale list before the corrected one.
  const [syncedComments, setSyncedComments] = useState(comments);
  if (syncedComments !== comments) {
    setSyncedComments(comments);
    setLiveComments(comments);
  }

  // Always keep the view pinned to the most recent comment — this is a
  // chat thread, not an article, so people shouldn't have to scroll down
  // every time to see what's new.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [liveComments]);

  // Live refresh: poll for new comments so a second person's message
  // shows up without anyone needing to reload the page.
  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      if (isPollingRef.current) return;
      isPollingRef.current = true;
      try {
        const res = await fetch(`/api/workspace/drafts/${draftId}/comments`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        const fresh: WorkspaceDraftComment[] = data.comments || [];
        // The known-id set is just the ids already on screen, so read it from
        // the current list instead of tracking it in a parallel ref. Returning
        // `prev` unchanged makes React bail out, exactly as the old guard did.
        setLiveComments((prev) => {
          const knownIds = new Set(prev.map((c) => c.id));
          const hasNew = fresh.some((c) => !knownIds.has(c.id));
          return hasNew || fresh.length !== knownIds.size ? fresh : prev;
        });
      } catch {
        // transient network error — try again on the next tick
      } finally {
        isPollingRef.current = false;
      }
    };

    const interval = setInterval(poll, POLL_MS);
    return () => { cancelled = true; clearInterval(interval); };
  }, [draftId]);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/workspace/drafts/${draftId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post comment");
      setLiveComments((prev) => [...prev, data.comment]);
      onCommentAdded(data.comment);
      setContent("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to post comment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-gray-700">
        Comments ({liveComments.length})
      </h3>

      {/* Comment list — newest is always visible at the bottom, no
          scrolling required to see the latest message. */}
      <div ref={listRef} className="space-y-4 max-h-80 overflow-y-auto pr-1 scroll-smooth">
        {liveComments.length === 0 && (
          <p className="text-sm text-gray-400">No comments yet.</p>
        )}
        {liveComments.map((c) => {
          const initials = (c.user_name || "?")
            .split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
          return (
            <div key={c.id} className="flex items-start gap-2.5">
              {c.user_avatar ? (
                <img src={c.user_avatar} alt={c.user_name} className="h-7 w-7 rounded-full object-cover shrink-0" />
              ) : (
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                  {initials}
                </div>
              )}
              <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-semibold text-gray-700">
                    {c.user_name || "Unknown"}
                    {c.user_role && <span className="font-normal text-gray-400"> ({c.user_role})</span>}
                  </span>
                  <span className="text-xs text-gray-400">{timeAgo(c.created_at)}</span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.content}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      {canComment && (
        <div className="flex gap-2 items-end">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add a comment..."
            rows={2}
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={loading || !content.trim()}
            className="px-4 py-2 bg-black text-white text-sm rounded-xl font-medium disabled:opacity-40 hover:bg-gray-800 transition-colors"
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
