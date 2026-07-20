import {
  SkeletonGrid,
  SkeletonList,
  SkeletonPage,
  SkeletonPageHeader
} from "@/components/ui/skeleton";

/**
 * Shell-level loading boundary.
 *
 * Catches any route inside the app shell that has no `loading.tsx` of its own
 * (for example `drafts/workspace/[id]`), and covers navigation between shell
 * sections. Intentionally generic — a header, some tiles, a list — because it
 * stands in for whichever section is arriving.
 */
export default function ShellLoading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader stats={3} />
      <SkeletonGrid count={4} className="sm:grid-cols-2 xl:grid-cols-4" tileClassName="h-16" />
      <SkeletonList rows={4} />
    </SkeletonPage>
  );
}
