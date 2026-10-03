import Image from "next/image";
import Link from "next/link";

import StoreBadges from "./StoreBadges";
import { BUSINESS_URL, PRIVACY_URL } from "@/lib/app-links";

type FooterLink = { label: string; href: string; external?: boolean };

const columns: { title: string; links: FooterLink[] }[] = [
  {
    title: "Explore",
    links: [
      { label: "Home", href: "/" },
      { label: "Cafe map", href: "/map" },
      { label: "Get the app", href: "/download-app" },
    ],
  },
  {
    title: "For cafes",
    links: [
      { label: "Claim your cafe", href: BUSINESS_URL, external: true },
      { label: "Nook for Business", href: BUSINESS_URL, external: true },
    ],
  },
];

// The Account column (Log in / Sign up) is out while accounts are shelved.
// `/login` and `/signup` still exist, they are just not linked from anywhere.

/**
 * Brand block left (wordmark, one line, store badges pinned to its bottom),
 * two link columns right, then a hairline and the legal row (Shop's layout,
 * Uber Eats' badge placement). Stacks on phones in the same order.
 */
/** `flush`: for pages that end in the app band (the landing): no top margin,
 * and no store badges, since the band right above already has them. */
export default function Footer({ flush = false }: { flush?: boolean }) {
  return (
    <footer className={flush ? "mt-16 border-t border-line bg-canvas sm:mt-20" : "mt-20 border-t border-line bg-canvas"}>
      <div className="mx-auto w-full max-w-7xl px-4 pb-8 pt-12 sm:px-8 sm:pt-16">
        <div className="grid gap-12 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:gap-16">
          <div className="flex flex-col">
            <Image src="/logo.svg" alt="Nook" width={1980} height={667} className="h-7 w-auto self-start" />
            <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-body">
              Philippine cafes, community curated. Find the right spot to work, study or slow down.
            </p>
            {flush ? null : <StoreBadges size="sm" className="mt-8 md:mt-auto md:pt-8" />}
          </div>

          <div className="grid grid-cols-2 gap-8">
            {columns.map((column) => (
              <div key={column.title}>
                <h3 className="text-[13px] font-medium text-muted">{column.title}</h3>
                <ul className="mt-3">
                  {column.links.map((link) => {
                    const cls =
                      "inline-flex min-h-10 items-center text-[15px] text-body transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-brand";
                    return (
                      <li key={link.label}>
                        {link.external ? (
                          <a href={link.href} className={cls}>
                            {link.label}
                          </a>
                        ) : (
                          <Link href={link.href} className={cls}>
                            {link.label}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col-reverse gap-3 border-t border-line pt-6 text-[13px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Nook. Made in Cebu for the local cafe community.</p>
          <a href={PRIVACY_URL} className="transition-colors hover:text-ink">
            Privacy policy
          </a>
        </div>
      </div>
    </footer>
  );
}
