import { CardListSkeleton, PageHeaderSkeleton, TableSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <CardListSkeleton rows={5} />
      <TableSkeleton rows={10} cols={6} />
    </div>
  );
}
