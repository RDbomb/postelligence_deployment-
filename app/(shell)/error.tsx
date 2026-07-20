"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";

/**
 * Error boundary for pages inside the signed-in app shell.
 *
 * Renders *within* the shell layout, so the sidebar stays intact and the user can
 * navigate away rather than hitting a dead end. It therefore uses the dashboard's
 * card chrome, not the full-page marketing treatment.
 *
 * Note: it does not catch failures in `(shell)/layout.tsx` itself — a layout's
 * errors bubble to the parent boundary (`app/error.tsx`) by design.
 */
export default function ShellError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard section error:", error);
  }, [error]);

  return (
    <div className="rounded-xl border border-[#1f2528]/10 bg-white p-8 text-center shadow-[0_14px_45px_rgba(31,37,40,0.08)] sm:p-12">
      <p
        className="text-[0.78rem] font-extrabold uppercase tracking-[0.08em]"
        style={{ color: "#d05945" }}
      >
        Section unavailable
      </p>

      <h2 className="mt-3 text-[clamp(1.5rem,2.5vw,2rem)] font-semibold leading-tight tracking-[-0.04em] text-[#191f23]">
        This section didn&apos;t load.
      </h2>

      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#5a656c]">
        The rest of your workspace is still available — pick another section from
        the sidebar, or retry this one.
      </p>

      {error.digest && (
        <p className="mx-auto mt-5 w-fit rounded-full border border-[#1f2528]/10 bg-[#f9faf7] px-4 py-1.5 font-mono text-[11px] text-[#5a656c]">
          Reference {error.digest}
        </p>
      )}

      <button
        onClick={reset}
        className="mt-7 inline-flex min-h-[3rem] items-center justify-center gap-2 rounded-full bg-[#1f2528] px-6 text-[0.92rem] font-semibold text-white transition-[background,transform] duration-200 hover:-translate-y-px hover:bg-[#2f7867]"
      >
        <RefreshCw className="h-4 w-4" />
        Retry
      </button>
    </div>
  );
}
