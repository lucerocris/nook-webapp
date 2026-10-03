const SHOW_FROM = ["block", "hidden sm:block", "hidden md:block", "hidden lg:block", "hidden xl:block"];

/** Same spacing and card widths as CafeShelf, so nothing moves when the real
 * shelf streams in. */
export default function CafeRowSkeleton({ title }: { title: string }) {
  return (
    <section className="pt-10 sm:pt-14" aria-busy="true">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-8">
        <h2 className="text-xl font-semibold tracking-[-0.02em] text-ink sm:text-[22px]">{title}</h2>
        <div aria-hidden="true" className="mt-4 grid grid-cols-1 gap-4 sm:mt-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-5 xl:grid-cols-5">
          {SHOW_FROM.map((cls, i) => (
            <div key={i} className={cls}>
              <div className="aspect-[5/4] w-full animate-pulse rounded-[20px] bg-paper" />
              <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-paper" />
              <div className="mt-2 h-3.5 w-1/2 animate-pulse rounded bg-paper" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
