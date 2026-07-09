import type { CafeSummary } from "@/lib/data/cafes-mappers";
import CafeCard from "./CafeCard";

type Props = {
  title: string;
  cafes: CafeSummary[];
  emptyHint?: string;
};

export default function CafeRow({ title, cafes, emptyHint }: Props) {
  if (cafes.length === 0) {
    if (!emptyHint) return null;
    return (
      <section className="py-8 sm:py-10">
        <div className="mx-auto w-full max-w-7xl px-6 sm:px-8">
          <h2 className="text-xl font-semibold text-[#3b3b3b]">{title}</h2>
          <p className="mt-4 text-sm text-zinc-500">{emptyHint}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 sm:py-10">
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-8">
        <h2 className="text-xl font-semibold text-[#3b3b3b]">{title}</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cafes.map((cafe, index) => (
            <CafeCard key={cafe.id} cafe={cafe} priority={index === 0} />
          ))}
        </div>
      </div>
    </section>
  );
}
