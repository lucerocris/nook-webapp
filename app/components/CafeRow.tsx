import CafeCard from "./CafeCard";

export default function CafeRow({ title }: { title: string }) {
  return (
    <section className="py-8 sm:py-10">
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-8">
        <h2 className="text-xl font-semibold text-[#3b3b3b]">{title}</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <CafeCard />
          <CafeCard />
          <CafeCard />
          <CafeCard />
        </div>
      </div>
    </section>
  );
}
