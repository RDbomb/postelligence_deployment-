import {
  SkeletonGrid,
  SkeletonPage,
  SkeletonPageHeader
} from "@/components/ui/skeleton";

export default function IntegrationsLoading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader stats={3} />
      <SkeletonGrid count={9} className="sm:grid-cols-2 xl:grid-cols-3" tileClassName="h-20" />
    </SkeletonPage>
  );
}
