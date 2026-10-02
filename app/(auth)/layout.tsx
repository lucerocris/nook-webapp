import Link from "next/link";
import type { Metadata } from "next";

// Disallowed in robots.txt too, but a disallowed URL can still be indexed from
// external links; noindex is what keeps it out once a crawler does fetch it.
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-8 block text-center text-sm text-zinc-500 transition-colors hover:text-zinc-800"
        >
          &larr; Back to Nook
        </Link>
        {children}
      </div>
    </div>
  );
}
