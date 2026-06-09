export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-64 rounded-lg bg-[rgb(var(--surface))] animate-pulse" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5">
            <div className="h-5 w-2/3 bg-[rgb(var(--background))] rounded animate-pulse" />
            <div className="mt-2 h-4 w-1/2 bg-[rgb(var(--background))] rounded animate-pulse" />
            <div className="mt-4 h-3 w-full bg-[rgb(var(--background))] rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
