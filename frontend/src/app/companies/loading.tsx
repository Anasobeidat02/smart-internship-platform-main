import { SkeletonList } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="h-8 w-48 rounded-lg bg-[rgb(var(--surface))] animate-pulse" />
      <div className="mt-2 h-4 w-72 rounded bg-[rgb(var(--surface))] animate-pulse" />
      <div className="mt-8">
        <SkeletonList count={6} />
      </div>
    </div>
  );
}
