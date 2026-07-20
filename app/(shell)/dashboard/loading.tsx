import {
  SkeletonGrid,
  SkeletonList,
  SkeletonPage,
  SkeletonPageHeader
} from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader stats={4} />
      <SkeletonGrid count={8} className="sm:grid-cols-2 xl:grid-cols-4" tileClassName="h-16" />
      <SkeletonList rows={5} />
    </SkeletonPage>
  );
}
