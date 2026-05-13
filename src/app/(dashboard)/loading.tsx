export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="h-8 w-56 rounded-md bg-slate-200/80" />
        <div className="h-4 w-96 max-w-full rounded-md bg-slate-200/60" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-border/70 bg-background p-5">
            <div className="h-4 w-24 rounded bg-slate-200/80" />
            <div className="mt-4 h-9 w-32 rounded bg-slate-200/70" />
            <div className="mt-3 h-3 w-full rounded bg-slate-200/50" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-border/70 bg-background p-5">
          <div className="h-5 w-40 rounded bg-slate-200/80" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-12 rounded bg-slate-200/50" />
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-border/70 bg-background p-5">
          <div className="h-5 w-40 rounded bg-slate-200/80" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-12 rounded bg-slate-200/50" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
