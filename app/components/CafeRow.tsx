import type { CafeSummary } from "@/lib/data/cafes-mappers";
import CafeCarousel from "./CafeCarousel";

type Props = {
  title: string;
  cafes: CafeSummary[];
  emptyHint?: string;
};

export default function CafeRow({ title, cafes, emptyHint }: Props) {
  if (cafes.length === 0) {
    if (!emptyHint) return null;
    return (
      <section className="py-4 sm:py-5">
        <div className="mx-auto w-full max-w-7xl px-6 sm:px-8">
          <h2 className="text-xl font-semibold text-[#3b3b3b]">{title}</h2>
          <p className="mt-4 text-sm text-zinc-500">{emptyHint}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-4 sm:py-5">
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-8">
        <h2 className="text-xl font-semibold text-[#3b3b3b]">{title}</h2>
        <div className="mt-4">
          <CafeCarousel cafes={cafes} />
        </div>
      </div>
    </section>
  );
}
