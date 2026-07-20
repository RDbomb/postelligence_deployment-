import {
  SkeletonGrid,
  SkeletonList,
  SkeletonPage,
  SkeletonPageHeader
} from "@/components/ui/skeleton";

export default function TeamLoading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader stats={4} />
      <SkeletonGrid count={3} className="sm:grid-cols-3" tileClassName="h-20" />
      <SkeletonList rows={6} />
    </SkeletonPage>
  );
}
