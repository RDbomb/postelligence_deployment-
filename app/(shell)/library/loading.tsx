import {
  SkeletonGrid,
  SkeletonPage,
  SkeletonPageHeader
} from "@/components/ui/skeleton";

export default function LibraryLoading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader stats={3} />
      <SkeletonGrid count={9} className="sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" tileClassName="h-32" />
    </SkeletonPage>
  );
}
