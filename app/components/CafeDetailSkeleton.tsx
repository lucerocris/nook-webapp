export default function CafeDetailSkeleton() {
  return (
    <main className="flex-1 pt-24 pb-16">
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-8">
        <div className="h-7 w-1/3 animate-pulse rounded bg-zinc-100" />
        <div className="mt-2 h-4 w-1/4 animate-pulse rounded bg-zinc-100" />
        <div className="mt-6 grid h-[280px] animate-pulse gap-2 rounded-sm bg-zinc-100 sm:h-[420px]" />
        <div className="mt-8 grid gap-9 lg:grid-cols-[minmax(0,1fr)_410px]">
          <div className="min-w-0 space-y-6">
            <div className="h-6 w-40 animate-pulse rounded bg-zinc-100" />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-32 animate-pulse rounded-xl bg-zinc-100"
                />
              ))}
            </div>
          </div>
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="h-64 animate-pulse rounded-xl bg-zinc-100" />
          </aside>
        </div>
      </div>
    </main>
  );
}
