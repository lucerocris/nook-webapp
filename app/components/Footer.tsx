import Image from "next/image";
import Link from "next/link";

const exploreLinks = [
  { label: "Home", href: "/" },
  { label: "Explore the map", href: "/map" },
  { label: "Download the app", href: "/download-app" },
];

const accountLinks = [
  { label: "Log in", href: "/login" },
  { label: "Sign up", href: "/signup" },
];

export default function Footer() {
  return (
    <footer className="mt-8 bg-[#3A5A40] text-white/85">
      <div className="mx-auto w-full max-w-7xl px-6 py-14 sm:px-8">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          <div className="max-w-xs">
            <Image
              src="/logo.svg"
              alt="Nook"
              width={1980}
              height={667}
              className="h-8 w-auto brightness-0 invert"
            />
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              Philippine cafes, community curated. Find the perfect spot to work,
              study, or chill.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:gap-16">
            <FooterColumn title="Explore" links={exploreLinks} />
            <FooterColumn title="Account" links={accountLinks} />
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/60">
            © 2026 Nook. Made for the local cafe community.
          </p>
          <a
            href="https://business.nookph.app/"
            className="text-xs font-medium text-white/80 underline-offset-4 transition-colors hover:text-white hover:underline"
          >
            Claim your Cafe →
          </a>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-white/50">
        {title}
      </h3>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-white/80 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
