import {
  SkeletonList,
  SkeletonPage,
  SkeletonPageHeader
} from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader />
      <SkeletonList rows={5} />
    </SkeletonPage>
  );
}
