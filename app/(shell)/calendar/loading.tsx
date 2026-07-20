import {
  SkeletonGrid,
  SkeletonList,
  SkeletonPage,
  SkeletonPageHeader
} from "@/components/ui/skeleton";

export default function CalendarLoading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader stats={3} />
      <SkeletonGrid count={7} className="grid-cols-7" tileClassName="h-24" />
      <SkeletonList rows={4} />
    </SkeletonPage>
  );
}
