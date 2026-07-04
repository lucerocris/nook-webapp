import CafeRow from "./components/CafeRow";
import Hero from "./components/Hero";

export default function Home() {
  return (
    <main className="flex-1">
      <Hero />
      <CafeRow title="Featured" />
      <CafeRow title="New" />
      <CafeRow title="Trending" />
    </main>
  );
}
