export default function LoadingState() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading brands"
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {Array.from({ length: 12 }, (_, i) => (
        <div
          key={`skeleton-${i}`}
          className="flex h-[20rem] flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="h-3 w-16 animate-pulse rounded bg-slate-200" />
          <div className="mt-3 h-6 w-2/3 animate-pulse rounded bg-slate-200" />
          <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-slate-200" />
          <div className="mt-6 h-10 w-full animate-pulse rounded-lg bg-slate-100" />
          <div className="mt-3 h-10 w-full animate-pulse rounded-lg bg-slate-100" />
          <div className="mt-auto pt-4">
            <div className="h-16 w-full animate-pulse rounded-lg bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
