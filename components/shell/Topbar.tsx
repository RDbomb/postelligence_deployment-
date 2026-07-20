"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Menu, Search, FileText, CalendarClock, CheckCircle2, Users, Image as ImageIcon, Loader2 } from "lucide-react";
import NotificationBell from "@/components/shell/NotificationBell";

interface TopbarProps {
  user: {
    email?: string | null;
    user_metadata?: { full_name?: string; avatar_url?: string; name?: string };
  };
  onMobileMenuToggle: () => void;
}

const titles: Record<string, string> = {
  "/dashboard": "Overview Dashboard",
  "/create": "Compose Content",
  "/drafts": "Saved Drafts",
  "/calendar": "Content Calendar",
  "/library": "Media Library",
  "/ai-studio": "AI Writing Studio",
  "/analytics": "Live Analytics",
  "/integrations": "Account Integrations",
  "/settings": "Workspaces & Settings"
};

interface SearchResult {
  id: string;
  type: "draft" | "scheduled" | "published" | "team" | "media";
  title: string;
  snippet: string;
  href: string;
}

export default function Topbar({ onMobileMenuToggle }: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const pageTitle = titles[pathname] || "Postelligence Workspace";

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  // The trimmed query that `results` actually belongs to. Tracking it lets
  // both the spinner and the visible result list be derived during render
  // instead of being pushed into state from the search effect.
  const [resultsQuery, setResultsQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const trimmedQuery = query.trim();
  const isSearchable = trimmedQuery.length >= 2;
  const loading = isSearchable && resultsQuery !== trimmedQuery;
  const visibleResults = isSearchable && resultsQuery === trimmedQuery ? results : [];

  // Debounced live search against /api/search
  useEffect(() => {
    if (!isSearchable) return;

    let cancelled = false;
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmedQuery)}`);
        if (cancelled || !res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setResults(data.results || []);
      } finally {
        // Mark this query as settled either way, so a failed request stops
        // the spinner exactly as it did before.
        if (!cancelled) setResultsQuery(trimmedQuery);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [trimmedQuery, isSearchable]);

  // Close the results dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function goToResult(href: string) {
    setOpen(false);
    setQuery("");
    setResults([]);
    setResultsQuery("");
    router.push(href);
  }

  return (
    <header className="relative z-30 mb-6 flex h-16 items-center justify-between rounded-2xl border border-[#1f2528]/12 bg-white/60 px-4 backdrop-blur-md">

      {/* Page Title & Mobile Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#1f2528]/12 hover:bg-[#f4f6f0] lg:hidden"
        >
          <Menu className="h-5 w-5 text-[#1f2528]" />
        </button>
        <h2 className="text-base font-bold text-[#1f2528] md:text-lg">{pageTitle}</h2>
      </div>

      {/* Right Tools */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div ref={containerRef} className="relative hidden max-w-xs md:block">
          {loading ? (
            <Loader2 className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
          ) : (
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          )}
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search posts..."
            className="h-10 w-48 rounded-xl border border-[#1f2528]/12 bg-[#f6f7f1]/50 pl-10 pr-4 text-xs font-semibold text-[#1f2528] placeholder-slate-400 focus:border-[#2f7867] focus:outline-none transition-colors"
          />

          {/* Results dropdown */}
          {open && query.trim().length >= 2 && (
            <div className="absolute right-0 top-12 z-40 max-h-96 w-80 overflow-y-auto rounded-xl border border-[#1f2528]/12 bg-white shadow-xl">
              {visibleResults.length === 0 && !loading && (
                <p className="px-4 py-3 text-xs text-slate-400">No matches in drafts, posts, media, or team content.</p>
              )}
              {visibleResults.map((result) => {
                const Icon =
                  result.type === "draft" ? FileText :
                  result.type === "scheduled" ? CalendarClock :
                  result.type === "published" ? CheckCircle2 :
                  result.type === "team" ? Users :
                  ImageIcon;
                const iconColor =
                  result.type === "draft" ? "text-[#2f7867]" :
                  result.type === "scheduled" ? "text-[#d05945]" :
                  result.type === "published" ? "text-[#2f7867]" :
                  result.type === "team" ? "text-[#5a656c]" :
                  "text-[#5a656c]";
                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => goToResult(result.href)}
                    className="flex w-full items-start gap-2.5 border-b border-[#1f2528]/6 px-4 py-2.5 text-left last:border-0 hover:bg-[#f4f6f0]"
                  >
                    <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${iconColor}`} />
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-bold text-[#1f2528]">{result.title}</span>
                      {result.snippet && (
                        <span className="block truncate text-[11px] text-slate-400">{result.snippet}</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Notification */}
        <NotificationBell />
      </div>
    </header>
  );
}
