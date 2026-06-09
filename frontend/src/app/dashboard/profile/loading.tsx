export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 rounded-lg bg-[rgb(var(--surface))] animate-pulse" />
      <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-10 rounded-lg bg-[rgb(var(--background))] animate-pulse" />
        ))}
      </div>
    </div>
  );
}
