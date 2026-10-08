import Link from "next/link";

/** An unknown code, or a crawl that is private, archived or removed. Same
 * look as the site's 404, with copy about crawls. */
export default function CrawlNotFound() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-6 pt-24 pb-12 text-center">
      <h1 className="text-balance text-3xl font-semibold tracking-[-0.02em] text-ink sm:text-4xl">
        This crawl isn&apos;t available
      </h1>
      <p className="mt-3 max-w-md text-sm text-body">
        The code may be mistyped, or the crawl was made private or taken down. Ask whoever sent
        it for a new link.
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
