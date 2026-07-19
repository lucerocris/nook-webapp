"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Until an error reporter is wired up, at least land this in the runtime
    // logs with its digest so a user report can be traced to a request.
    console.error("[app/error]", error.digest, error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-6 pt-24 pb-12 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#3A5A40]">
        Something went wrong
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-[#101514] sm:text-4xl">
        We hit a snag
      </h1>
      <p className="mt-3 max-w-md text-sm text-[#3b3b3b]">
        This one is on us — the page couldn&apos;t load. Try again, or head back
        and keep browsing cafes.
      </p>
      <div className="mt-7 flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-[#3A5A40] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#2f4833]"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-medium text-[#3b3b3b] transition-colors hover:bg-zinc-50"
        >
          Back home
        </Link>
      </div>
      {error.digest ? (
        <p className="mt-6 text-xs text-[#6b6b6b]">Reference: {error.digest}</p>
      ) : null}
    </main>
  );
}
