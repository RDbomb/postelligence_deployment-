import {
  SkeletonGrid,
  SkeletonList,
  SkeletonPage,
  SkeletonPageHeader
} from "@/components/ui/skeleton";

export default function AutomationLoading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader stats={3} />
      <SkeletonGrid count={3} className="sm:grid-cols-3" tileClassName="h-20" />
      <SkeletonList rows={5} />
    </SkeletonPage>
  );
}
