export default function CafeDetailSkeleton() {
  return (
    <main className="flex-1 pt-0 pb-[calc(6.5rem+env(safe-area-inset-bottom))] lg:pt-24 lg:pb-0">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-8">
        {/* Mirrors the real page's order swap: gallery first on mobile, title
            first at `lg`. Keeping the two in step is what stops the layout from
            jumping when the suspended content resolves. */}
        <div className="flex flex-col gap-6">
          <div className="order-2 lg:order-1">
            <div className="h-7 w-1/2 animate-pulse rounded bg-subtle" />
            <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-subtle" />
          </div>
          <div className="order-1 -mx-4 h-[320px] animate-pulse bg-subtle sm:-mx-8 sm:h-[420px] lg:order-2 lg:mx-0 lg:h-[440px] lg:rounded-[var(--radius-card)]" />
        </div>

        <div className="mt-8 grid gap-9 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-16">
          <div className="min-w-0 space-y-6">
            <div className="h-6 w-40 animate-pulse rounded bg-subtle" />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-32 animate-pulse rounded-xl bg-subtle"
                />
              ))}
            </div>
          </div>
          <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
            <div className="h-64 animate-pulse rounded-[var(--radius-card)] bg-subtle" />
          </aside>
        </div>
      </div>
    </main>
  );
}
