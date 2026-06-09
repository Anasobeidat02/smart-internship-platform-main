export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="h-8 w-48 rounded-lg bg-[rgb(var(--surface))] animate-pulse" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-52 rounded-2xl bg-[rgb(var(--surface))] animate-pulse" />
        ))}
      </div>
    </div>
  );
}
