function SkeletonCard() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-white">
      <div className="aspect-[4/3] w-full animate-pulse rounded-xl bg-zinc-100" />
      <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-zinc-100" />
      <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-zinc-100" />
      <div className="mt-3 h-3 w-full animate-pulse rounded bg-zinc-100" />
    </div>
  );
}

type Props = {
  title: string;
  columns?: number;
};

export default function CafeRowSkeleton({ title, columns = 4 }: Props) {
  return (
    <section className="py-8 sm:py-10">
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-8">
        <h2 className="text-xl font-semibold text-[#3b3b3b]">{title}</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: columns }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
