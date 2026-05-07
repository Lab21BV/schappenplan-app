import { CardListSkeleton, PageHeaderSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <div className="space-y-3">
        <CardListSkeleton rows={6} />
        <CardListSkeleton rows={4} />
        <CardListSkeleton rows={5} />
      </div>
    </div>
  );
}
