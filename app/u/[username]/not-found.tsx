import Link from "next/link";

/** An unknown username, or a profile that is not shown (suspended). Same
 * look as the site's 404, with copy about people instead of cafes. */
export default function ProfileNotFound() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-6 pt-24 pb-12 text-center">
      <h1 className="text-3xl font-semibold tracking-[-0.02em] text-ink sm:text-4xl">
        This profile isn&apos;t available
      </h1>
      <p className="mt-3 max-w-md text-sm text-body">
        The link may be wrong, or the account is no longer on Nook.
      </p>
      <div className="mt-7 flex items-center gap-3">
        <Link
          href="/map"
          className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          Browse cafes
        </Link>
        <Link
          href="/"
          className="rounded-full border border-line-strong px-6 py-3 text-sm font-medium text-body transition-colors hover:bg-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          Back home
        </Link>
      </div>
    </main>
  );
}
