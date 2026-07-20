"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Route-level error boundary for the root segment.
 *
 * Catches render/data errors from any page without a closer `error.tsx`.
 * Without it, Next.js shows its own unstyled screen — and in production, a
 * visitor gets nothing actionable.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface in server/browser logs. Point this at an error reporter when one exists.
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <main className="marketing-shell marketing-page-hero flex min-h-screen items-center justify-center overflow-hidden px-6 py-20">
      <div className="marketing-orb marketing-orb-teal" aria-hidden="true" />
      <div className="marketing-orb marketing-orb-coral" aria-hidden="true" />

      <div className="relative w-full max-w-xl text-center">
        {/* Coral is the palette's secondary accent — used here to mark failure
            without introducing a colour the brand doesn't already own. */}
        <p className="marketing-eyebrow" style={{ color: "#d05945" }}>
          Something broke
        </p>

        <h1 className="marketing-section-title mt-4">This page didn&apos;t load.</h1>

        <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-[#5a656c]">
          The error is logged. Retrying usually clears it — if it keeps happening,
          send the reference below to support.
        </p>

        {error.digest && (
          <p className="mx-auto mt-6 w-fit rounded-full border border-[#1f2528]/10 bg-white/70 px-4 py-1.5 font-mono text-[11px] tracking-tight text-[#5a656c] backdrop-blur">
            Reference {error.digest}
          </p>
        )}

        <div className="mt-9 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
          <button onClick={reset} className="marketing-cta-primary w-full sm:w-auto">
            Try again
          </button>
          <Link href="/dashboard" className="marketing-cta-secondary w-full sm:w-auto">
            Go to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
