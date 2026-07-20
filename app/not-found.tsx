import Link from "next/link";

export const metadata = {
  title: "Page not found · Postelligence",
};

/** Rendered for unmatched routes and for any `notFound()` call without a closer boundary. */
export default function NotFound() {
  return (
    <main className="marketing-shell marketing-page-hero flex min-h-screen items-center justify-center overflow-hidden px-6 py-20">
      {/* Brand atmosphere — same orbs used across the marketing surface. */}
      <div className="marketing-orb marketing-orb-teal" aria-hidden="true" />
      <div className="marketing-orb marketing-orb-coral" aria-hidden="true" />

      <div className="relative w-full max-w-xl text-center">
        <p className="marketing-eyebrow">Error 404</p>

        <h1 className="marketing-section-title mt-4">This page isn&apos;t here.</h1>

        <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-[#5a656c]">
          The link may be out of date, or the page may have moved. Your workspace
          and scheduled posts are unaffected.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
          <Link href="/dashboard" className="marketing-cta-primary w-full sm:w-auto">
            Go to dashboard
          </Link>
          <Link href="/" className="marketing-cta-secondary w-full sm:w-auto">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
