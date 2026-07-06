"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [isMenuOpen]);

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
            href="https://business.nookph.app/"
            className="rounded-full border border-zinc-300 bg-transparent px-4 py-2 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50"
          >
            Claim your Cafe
          </Link>

          <div ref={menuRef} className="relative">
            <button
              type="button"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
              aria-haspopup="menu"
              onClick={() => setIsMenuOpen((o) => !o)}
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

            {isMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-white shadow-lg ring-1 ring-zinc-200/70 overflow-hidden"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => setIsMenuOpen(false)}
                  className="block w-full px-4 py-2.5 text-left text-sm text-zinc-800 transition-colors hover:bg-zinc-50"
                >
                  Log in or sign up
                </button>
                <Link
                  href="/download-app"
                  role="menuitem"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-4 py-2.5 text-sm text-zinc-800 transition-colors hover:bg-zinc-50"
                >
                  Download the app
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
