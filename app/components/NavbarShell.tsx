"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  CaretLeft,
  DeviceMobile,
  List,
  MapTrifold,
  Storefront,
  X,
} from "@phosphor-icons/react";
import { signOut } from "@/app/(auth)/actions";
import { cn } from "@/lib/utils";
import HeroSearch from "./HeroSearch";
import type { SearchTags } from "@/lib/data/search";

const BUSINESS_URL = "https://business.nookph.app/";

const NAV_LINKS = [
  { label: "Map", href: "/map", icon: MapTrifold },
  { label: "Get the app", href: "/download-app", icon: DeviceMobile },
] as const;

/**
 * Global header. Two layouts from one bar (see docs/references/webapp):
 * - Home, before scrolling: transparent, links grouped beside the logo and a
 *   single pill CTA on the right.
 * - Everywhere else, and home once scrolled: solid white with a hairline, and
 *   on inner pages a compact search pill in the middle of the bar.
 * Below `md` the links fold into a menu sheet under the bar.
 */
export default function NavbarShell({
  userEmail,
  tags,
}: {
  userEmail: string | null;
  tags: SearchTags;
}) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isMapPage = pathname === "/map";
  // The menu page is a drill-down off a cafe, so the navbar carries the way
  // back to it instead of the page rendering its own control.
  const menuBackHref = pathname.match(/^\/cafes\/([^/]+)\/menu$/)?.[1];
  // The cafe detail page runs its own chrome below `lg` — a back button over
  // the photo and a sticky action bar — so the global navbar would only be
  // taking space off a phone screen. It still renders at `lg` and above.
  const isCafeDetail = /^\/cafes\/[^/]+$/.test(pathname);
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the menu on navigation (state adjusted during render, not in an
  // effect, so there is no extra commit with the stale menu open).
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setIsMenuOpen(false);
  }

  useEffect(() => {
    if (!isMenuOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [isMenuOpen]);

  if (menuBackHref) {
    return (
      <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-white">
        <nav className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-8">
          <Link
            href={`/cafes/${menuBackHref}`}
            aria-label="Back to cafe"
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-line text-ink transition-colors hover:bg-subtle"
          >
            <CaretLeft size={18} />
          </Link>
          <span className="text-sm font-medium text-body">Back to cafe</span>
        </nav>
      </header>
    );
  }

  const solid = !isHome || scrolled || isMenuOpen;
  // The compact search sits in the bar on inner pages that don't already
  // have their own search on screen.
  const showBarSearch = !isHome;

  return (
    <header
      ref={menuRef}
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-colors duration-150",
        isCafeDetail && "hidden lg:block",
        // Solid once scrolled or off the home page: white, closed by a
        // hairline (DailyArt). Over the home hero: no fill (Seed).
        solid ? "border-line bg-white" : "border-transparent bg-white",
      )}
    >
      <nav
        className={cn(
          "mx-auto flex h-16 items-center gap-4 px-4 sm:px-6 lg:gap-8",
          isMapPage ? "max-w-none sm:px-8" : "max-w-[1240px]",
        )}
      >
        <Link href="/" aria-label="Nook home" className="flex shrink-0 items-center">
          <Image
            src="/logo.svg"
            alt="Nook"
            width={1980}
            height={667}
            priority
            className="h-7 w-auto"
          />
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-full px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-brand",
                    active
                      ? "text-ink underline decoration-fern decoration-2 underline-offset-[10px]"
                      : "text-body hover:text-ink",
                  )}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex min-w-0 flex-1 justify-center">
          {showBarSearch ? (
            <div className="hidden w-full max-w-md lg:block">
              <HeroSearch tags={tags} variant="nav" />
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {userEmail ? (
            <form action={signOut} className="hidden md:block">
              <button
                type="submit"
                title={`Signed in as ${userEmail}`}
                className="rounded-full px-3 py-2 text-sm font-medium text-body transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-brand"
              >
                Sign out
              </button>
            </form>
          ) : null}
          <Link
            href={BUSINESS_URL}
            className="hidden h-10 items-center gap-1.5 rounded-full border border-line-strong bg-white px-4 text-sm font-medium text-ink transition-colors hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand md:inline-flex"
          >
            For cafes
            <ArrowUpRight size={14} weight="bold" />
          </Link>

          <button
            type="button"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            onClick={() => setIsMenuOpen((o) => !o)}
            className="flex size-11 items-center justify-center rounded-full border border-line-strong bg-white text-ink transition-colors hover:border-ink md:hidden"
          >
            {isMenuOpen ? <X size={18} /> : <List size={18} />}
          </button>
        </div>
      </nav>

      {isMenuOpen ? (
        <div
          id="mobile-menu"
          className="border-t border-line bg-white px-4 pb-5 pt-2 shadow-float md:hidden"
        >
          <ul className="flex flex-col">
            {NAV_LINKS.map(({ label, href, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex items-center gap-3 border-b border-line py-4 text-base font-medium text-ink"
                >
                  <Icon size={20} className="text-fern" />
                  {label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={BUSINESS_URL}
                className="flex items-center gap-3 border-b border-line py-4 text-base font-medium text-ink"
              >
                <Storefront size={20} className="text-fern" />
                For cafes
                <ArrowUpRight size={14} className="ml-auto text-muted" />
              </Link>
            </li>
          </ul>
          {userEmail ? (
            <form action={signOut} className="mt-4">
              <p className="truncate text-xs text-muted">Signed in as {userEmail}</p>
              <button
                type="submit"
                className="mt-2 text-sm font-medium text-ink underline underline-offset-4"
              >
                Sign out
              </button>
            </form>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
