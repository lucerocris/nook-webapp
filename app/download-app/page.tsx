import type { Metadata } from "next";
import Image from "next/image";
import { ListHeart, MapPin, Sparkle } from "@phosphor-icons/react/dist/ssr";

import Footer from "@/app/components/Footer";
import StoreBadges from "@/app/components/StoreBadges";
import { SITE_URL as siteUrl } from "@/lib/env";


/** The same two framed screens as the landing's app band: real-device
 * captures in the iPhone 17 Pro frame (nook-ss-framed, nook-marketing
 * brand/assets/screens/framed), resized to 600px WebP. */
const SCREENS = [
  { src: "/app-screens/1-home.webp", alt: "Nook app home: featured cafes and new cafes" },
  { src: "/app-screens/2-map-list.webp", alt: "Nook app map of Cebu with a list of cafes in view" },
] as const;

export const metadata: Metadata = {
  title: "Download the app",
  description:
    "Nook for iPhone and Android — find cafes to work, study, or chill in Cebu, save the ones you like, and keep a ranked list of everywhere you have been.",
  alternates: { canonical: `${siteUrl}/download-app` },
  openGraph: {
    title: "Download Nook",
    description:
      "Find cafes to work, study, or chill in Cebu. Free on the App Store and Google Play.",
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
    icon: ListHeart,
    title: "Keep your lists",
    body: "Save cafes to Want to Try, then rank the ones you have actually been to.",
  },
];

export default function DownloadAppPage() {
  return (
    <>
      <main className="flex-1 pt-20 sm:pt-24">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-8">
          {/* One tinted card: copy and store badges on the left, the phone on
              the right running off the card's bottom edge, with the QR on a
              small card over it (desktop only — on a phone you tap the badge). */}
          <section className="relative overflow-hidden rounded-[28px] bg-brand-soft">
            <div className="grid items-center gap-10 px-6 pt-12 sm:px-12 sm:pt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:gap-12 lg:px-16 lg:pt-0">
              <div className="mx-auto max-w-xl text-center lg:mx-0 lg:py-20 lg:text-left">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
                  Nook for iPhone and Android
                </p>
                <h1 className="mt-3 text-balance text-4xl font-semibold leading-[1.08] tracking-[-0.03em] text-ink sm:text-5xl">
                  Every cafe on Nook, in your pocket.
                </h1>
                <p className="mt-4 text-base leading-relaxed text-body sm:text-lg">
                  The map, your saved lists and your rankings, on the phone you
                  actually take to the cafe.
                </p>

                <ul className="mt-8 space-y-4 text-left">
                  {features.map(({ icon: Icon, title, body }) => (
                    <li key={title} className="flex gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-brand">
                        <Icon size={18} weight="fill" />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-ink">{title}</span>
                        <span className="block text-sm leading-relaxed text-body">{body}</span>
                      </span>
                    </li>
                  ))}
                </ul>

                <StoreBadges className="mt-8 justify-center lg:justify-start" />
                <p className="mt-3 text-xs text-muted">Free on the App Store and Google Play</p>
                <div className="mt-8 hidden items-center gap-4 lg:flex">
                  <div className="rounded-xl bg-white p-2 shadow-raise">
                    <Image
                      src="/app-store-qr.svg"
                      alt="QR code linking to Nook on the App Store"
                      width={72}
                      height={72}
                      unoptimized
                    />
                  </div>
                  <p className="max-w-[16ch] text-[13px] text-muted">Scan with your phone for the App Store</p>
                </div>
              </div>

              <div className="relative mx-auto flex w-full max-w-[420px] items-start justify-center gap-4 self-center pb-12 lg:max-w-[460px] lg:py-16">
                {SCREENS.map((screen, i) => (
                  <Image
                    key={screen.src}
                    src={screen.src}
                    alt={screen.alt}
                    width={600}
                    height={1250}
                    priority={i === 0}
                    sizes="(min-width: 1024px) 220px, 45vw"
                    className={`h-auto w-1/2 ${i === 1 ? "mt-12" : "mb-12"}`}
                  />
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
