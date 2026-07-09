import Link from "next/link";

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
