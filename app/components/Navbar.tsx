"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={[
        "fixed inset-x-0 top-0 z-50 transition-all duration-300 ease-out",
        scrolled
          ? "bg-white/95 backdrop-blur border-b border-zinc-200"
          : "bg-transparent border-b border-transparent",
      ].join(" ")}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-8">
        <Link href="/" aria-label="Nook home" className="flex items-center">
          <Image
            src="/logo.svg"
            alt="Nook"
            width={1980}
            height={667}
            priority
            className="h-7 w-auto"
          />
        </Link>

        <div className="flex items-center gap-4 sm:gap-6">
          <Link
            href="/login"
            className="text-sm font-medium text-zinc-800 transition-colors hover:text-zinc-950"
          >
            Log in
          </Link>

          <Link
            href="/claim"
            className="rounded-full border border-zinc-300 bg-transparent px-4 py-2 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50"
          >
            Claim your Cafe
          </Link>

          <button
            type="button"
            aria-label="Open menu"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-300 transition-colors hover:bg-zinc-50"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <line x1="2" y1="5" x2="16" y2="5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <line x1="2" y1="9" x2="16" y2="9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <line x1="2" y1="13" x2="16" y2="13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </nav>
    </header>
  );
}
