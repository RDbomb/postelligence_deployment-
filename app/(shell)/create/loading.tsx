import {
  SkeletonGrid,
  SkeletonPage,
  SkeletonPageHeader
} from "@/components/ui/skeleton";

export default function CreateLoading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader />
      <SkeletonGrid count={2} className="xl:grid-cols-2" tileClassName="h-64" />
    </SkeletonPage>
  );
}
