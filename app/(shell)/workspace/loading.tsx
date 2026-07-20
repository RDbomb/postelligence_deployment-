import {
  SkeletonGrid,
  SkeletonPage,
  SkeletonPageHeader
} from "@/components/ui/skeleton";

export default function WorkspaceLoading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader stats={3} />
      <SkeletonGrid count={3} className="sm:grid-cols-3" tileClassName="h-20" />
    </SkeletonPage>
  );
}
