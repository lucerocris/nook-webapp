import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found · Nook",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-6 pt-24 pb-12 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#3A5A40]">
        404
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-[#101514] sm:text-4xl">
        We couldn&apos;t find that page
      </h1>
      <p className="mt-3 max-w-md text-sm text-[#3b3b3b]">
        The link may be broken, or the cafe may no longer be listed on Nook.
      </p>
      <div className="mt-7 flex items-center gap-3">
        <Link
          href="/map"
          className="rounded-full bg-[#3A5A40] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#2f4833]"
        >
          Browse cafes
        </Link>
        <Link
          href="/"
          className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-medium text-[#3b3b3b] transition-colors hover:bg-zinc-50"
        >
          Back home
        </Link>
      </div>
    </main>
  );
}
