import { cn } from "@/lib/utils";

/**
 * Loading-skeleton primitives.
 *
 * Tones are taken from the existing analytics skeleton so every loading state in
 * the app reads as one system:
 *   #f0f1eb  default block      #e8e9e3  emphasis (headings, values)
 *   #eaf3ed  teal-tinted (eyebrows, accents)
 *
 * `motion-safe:` keeps the pulse off for users who ask for reduced motion.
 */

type SkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
  tone?: "default" | "strong" | "accent";
};

const TONES = {
  default: "bg-[#f0f1eb]",
  strong: "bg-[#e8e9e3]",
  accent: "bg-[#eaf3ed]",
} as const;

export function Skeleton({ className, tone = "default", ...props }: SkeletonProps) {
  return <div className={cn("rounded", TONES[tone], className)} {...props} />;
}

/** Card chrome matching the dashboard surface. */
export function SkeletonCard({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[#1f2528]/10 bg-white p-5 shadow-[0_14px_45px_rgba(31,37,40,0.08)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/** The eyebrow + title + subtitle block that opens most shell pages. */
export function SkeletonPageHeader({ stats = 0 }: { stats?: number }) {
  return (
    <SkeletonCard className="md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <Skeleton tone="accent" className="h-5 w-32 rounded-full" />
          <Skeleton tone="strong" className="h-9 w-64 rounded-lg" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        {stats > 0 && (
          <div
            className="grid min-w-[280px] gap-3 rounded-xl border border-[#1f2528]/10 bg-[#f9faf7] p-3"
            style={{ gridTemplateColumns: `repeat(${stats}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: stats }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton tone="strong" className="h-7 w-10 rounded-lg" />
              </div>
            ))}
          </div>
        )}
      </div>
    </SkeletonCard>
  );
}

/** A responsive grid of placeholder tiles. */
export function SkeletonGrid({
  count = 6,
  className = "sm:grid-cols-2 xl:grid-cols-3",
  tileClassName = "h-40",
}: {
  count?: number;
  className?: string;
  tileClassName?: string;
}) {
  return (
    <div className={cn("grid gap-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} className="p-4">
          <div className="flex items-start justify-between">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </div>
          <Skeleton className="mt-4 h-3 w-24" />
          <Skeleton tone="strong" className="mt-2 h-7 w-16 rounded-lg" />
          <Skeleton className={cn("mt-3 w-full rounded-lg", tileClassName)} />
        </SkeletonCard>
      ))}
    </div>
  );
}

/** A stack of list rows — drafts, tickets, members, activity. */
export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <SkeletonCard>
      <div className="mb-5 space-y-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton tone="strong" className="h-6 w-48 rounded-lg" />
      </div>
      <div className="overflow-hidden rounded-xl border border-[#1f2528]/10">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between border-b border-[#1f2528]/10 bg-white p-4 last:border-0"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton tone="strong" className="h-3.5 w-44" />
                <Skeleton className="h-2.5 w-24" />
              </div>
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </SkeletonCard>
  );
}

/** Wrapper that applies the shared pulse and vertical rhythm. */
export function SkeletonPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-5 motion-safe:animate-pulse" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>
      {children}
    </div>
  );
}
