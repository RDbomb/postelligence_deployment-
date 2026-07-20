import { BrandMark } from "@/components/marketing/BrandMark";

/**
 * Root loading boundary.
 *
 * Covers every route without a closer `loading.tsx` — the marketing pages, /login,
 * /admin — and, importantly, the window while `(shell)/layout.tsx` awaits auth and
 * its Supabase queries. Without this, that wait renders as a blank screen.
 *
 * Deliberately quiet: a full skeleton here would be wrong, because at this point
 * we do not yet know which page is coming.
 */
export default function RootLoading() {
  return (
    <main
      className="marketing-shell flex min-h-screen items-center justify-center overflow-hidden px-6"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="marketing-orb marketing-orb-teal" aria-hidden="true" />
      <div className="marketing-orb marketing-orb-coral" aria-hidden="true" />

      <div className="relative flex flex-col items-center gap-6">
        <span className="motion-safe:animate-pulse">
          <BrandMark size="lg" />
        </span>

        {/* Indeterminate track — the sweep reads as progress without implying a
            percentage we cannot know. Falls back to a static bar when the user
            has asked for reduced motion. */}
        <span className="sr-only">Loading</span>
        <div
          className="h-0.5 w-40 overflow-hidden rounded-full bg-[#1f2528]/10"
          aria-hidden="true"
        >
          <div className="h-full w-1/3 rounded-full bg-[#2f7867] motion-safe:animate-[loading-sweep_1.15s_ease-in-out_infinite]" />
        </div>
      </div>
    </main>
  );
}
