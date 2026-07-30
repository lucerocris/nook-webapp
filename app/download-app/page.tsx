import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  AppleLogo,
  CaretLeft,
  DeviceMobile,
  GooglePlayLogo,
  MapPin,
  Sparkle,
} from "@phosphor-icons/react/dist/ssr";

import Footer from "@/app/components/Footer";
import { cn } from "@/lib/utils";
import { SITE_URL as siteUrl } from "@/lib/env";

/**
 * Resolved from the App Store rather than typed from memory: the iOS bundle id
 * in `nook-mobile` (`app.nookph`, in both `build.gradle.kts` and the Xcode
 * project) looked up against Apple's public catalogue returns exactly one
 * record — "nook - Cafe Finder", seller Cris Lawrence Lucero, track 6782604940.
 * It is a Philippines-storefront release; the US catalogue has no such app,
 * which is why the link is /ph/.
 */
const APP_STORE_URL =
  "https://apps.apple.com/ph/app/nook-cafe-finder/id6782604940";

/**
 * Android shares the `app.nookph` id but is not published — the Play listing
 * 404s — so it is shown as pending rather than linked somewhere broken.
 */
const PLAY_STORE_URL: string | null = null;

/**
 * iPhone 17 simulator captures, resized to 900px wide and converted to WebP
 * (2.2MB and 1.6MB of PNG became 111KB and 81KB). Their 1206x2622 source is a
 * 0.460 ratio against the frame's 0.462, so `object-cover` crops essentially
 * nothing.
 */
const SCREENS = [
  {
    src: "/app-home.webp",
    alt: "The Nook app's home feed, showing featured and newly added cafes in Cebu",
  },
  {
    src: "/app-cafe.webp",
    alt: "A cafe page in the Nook app, showing its rating, opening hours, and amenities",
  },
];

export const metadata: Metadata = {
  title: "Download the app",
  description:
    "Nook for iPhone — find cafes to work, study, or chill in Cebu, save the ones you like, and keep a ranked list of everywhere you have been.",
  alternates: { canonical: `${siteUrl}/download-app` },
  openGraph: {
    title: "Download Nook",
    description:
      "Find cafes to work, study, or chill in Cebu. Free on the App Store.",
    url: `${siteUrl}/download-app`,
    siteName: "Nook",
    type: "website",
  },
};

const features = [
  {
    icon: MapPin,
    title: "Find a spot nearby",
    body: "Browse the map, filter by Wi-Fi, outlets, and vibe, and see what is open right now.",
  },
  {
    icon: Sparkle,
    title: "Ask for a match",
    body: "Describe the kind of place you want and let Nook narrow it down for you.",
  },
  {
    icon: DeviceMobile,
    title: "Keep your lists",
    body: "Save cafes to Want to Try, then rank the ones you have actually been to.",
  },
];

export default function DownloadAppPage() {
  return (
    <>
      <main className="flex-1 pt-28 pb-16 sm:pt-36 lg:pt-44">
        <div className="mx-auto w-full max-w-7xl px-6 sm:px-8">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-[#3b3b3b] transition-colors hover:text-[#31533f]"
          >
            <CaretLeft size={16} weight="bold" />
            Back to Nook
          </Link>

          {/* Copy leads on a phone; the device sits beside it from `lg` up. */}
          <div className="mt-4 grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:gap-16">
            <div className="min-w-0">
              <h1 className="text-4xl font-semibold tracking-tight text-[#2f2f2f] sm:text-5xl">
                Nook in your pocket.
              </h1>
              <p className="mt-4 max-w-xl text-lg leading-relaxed text-[#3b3b3b]">
                Every cafe on Nook, with the map, your lists, and your rankings —
                on the phone you actually take to the cafe.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <a
                  href={APP_STORE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-14 items-center justify-center gap-3 rounded-2xl bg-[#31533f] px-6 text-white transition-colors hover:bg-[#294635] sm:w-auto"
                >
                  <AppleLogo size={26} weight="fill" className="shrink-0" />
                  <span className="text-left leading-tight">
                    <span className="block text-xs font-medium text-white/75">
                      Download on the
                    </span>
                    <span className="block text-base font-semibold">
                      App Store
                    </span>
                  </span>
                </a>

                {PLAY_STORE_URL ? (
                  <a
                    href={PLAY_STORE_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-14 items-center justify-center gap-3 rounded-2xl border border-zinc-300 bg-white px-6 text-[#3b3b3b] transition-colors hover:bg-zinc-50"
                  >
                    <GooglePlayLogo size={24} className="shrink-0" />
                    <span className="text-left leading-tight">
                      <span className="block text-xs font-medium text-zinc-500">
                        Get it on
                      </span>
                      <span className="block text-base font-semibold">
                        Google Play
                      </span>
                    </span>
                  </a>
                ) : (
                  <span className="flex h-14 items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-300 px-6 text-[#6b6b6b]">
                    <GooglePlayLogo size={24} className="shrink-0" />
                    <span className="text-left leading-tight">
                      <span className="block text-xs font-medium text-zinc-500">
                        Android
                      </span>
                      <span className="block text-base font-semibold">
                        Coming soon
                      </span>
                    </span>
                  </span>
                )}
              </div>

              <p className="mt-4 text-sm text-zinc-500">
                Free on iPhone · iOS 13 and later
              </p>
            </div>

            {/* Kept out of the copy column so that on a phone the device shows
                straight after the download button rather than below the whole
                feature list. */}
            <PhoneDuo />
          </div>

          <ul className="mt-14 grid gap-8 sm:grid-cols-3 lg:mt-20">
            {features.map(({ icon: Icon, title, body }) => (
              <li key={title}>
                <Icon size={22} className="text-[#3A5A40]" />
                <h2 className="mt-3 text-sm font-semibold text-[#101514]">
                  {title}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-[#6b6b6b]">
                  {body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </main>

      <Footer />
    </>
  );
}

/**
 * The two screens side by side, the second dropped slightly so the pair reads
 * as a set rather than a pair of columns. Capped in width because a device mock
 * filling a 420px column stands 910px tall and sets the height of the whole
 * section.
 */
function PhoneDuo() {
  return (
    <div className="mx-auto flex w-full max-w-[320px] items-start justify-center gap-3 sm:max-w-[360px] sm:gap-4 lg:max-w-none">
      <PhoneFrame {...SCREENS[0]} priority />
      <PhoneFrame {...SCREENS[1]} className="mt-8 sm:mt-10" />
    </div>
  );
}

/** Sized by aspect ratio, so it scales from a 320px phone to the desktop
 *  column without a breakpoint per size. */
function PhoneFrame({
  src,
  alt,
  className,
  priority,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div className={cn("w-1/2 min-w-0", className)}>
      {/* Border only — the simulator capture already carries the iPhone 17's
          Dynamic Island, so drawing one here doubled it. */}
      <div className="relative aspect-[9/19.5] w-full rounded-[1.5rem] border-[6px] border-[#101514] bg-[#101514] shadow-[0_18px_44px_-16px_rgba(15,35,20,0.45)]">
        <div className="relative h-full w-full overflow-hidden rounded-[1.05rem] bg-white">
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(min-width: 1024px) 200px, 160px"
            className="object-cover"
            priority={priority}
          />
        </div>
      </div>
    </div>
  );
}
