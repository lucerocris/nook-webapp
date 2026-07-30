export default function CafeDetailSkeleton() {
  return (
    <main className="flex-1 pt-0 pb-[calc(6.5rem+env(safe-area-inset-bottom))] lg:pt-24 lg:pb-16">
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-8">
        {/* Mirrors the real page's order swap: gallery first on mobile, title
            first at `lg`. Keeping the two in step is what stops the layout from
            jumping when the suspended content resolves. */}
        <div className="flex flex-col gap-6">
          <div className="order-2 lg:order-1">
            <div className="h-7 w-1/2 animate-pulse rounded bg-zinc-100" />
            <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-zinc-100" />
          </div>
          <div className="order-1 -mx-6 h-[300px] animate-pulse bg-zinc-100 sm:-mx-8 sm:h-[380px] lg:order-2 lg:mx-0 lg:h-[420px] lg:rounded-sm" />
        </div>

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
          <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
            <div className="h-64 animate-pulse rounded-xl bg-zinc-100" />
          </aside>
        </div>
      </div>
    </main>
  );
}
