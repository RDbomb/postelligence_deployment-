import {
  SkeletonGrid,
  SkeletonPage,
  SkeletonPageHeader
} from "@/components/ui/skeleton";

export default function AiStudioLoading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader />
      <SkeletonGrid count={4} className="sm:grid-cols-2" tileClassName="h-40" />
    </SkeletonPage>
  );
}
