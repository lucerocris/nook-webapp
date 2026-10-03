import Image from "next/image";

import StoreBadges from "./StoreBadges";

/** Real-device captures in the iPhone 17 Pro frame (home from nook-ss-framed,
 * map from nook-marketing/brand/assets/screens/framed), resized to 600px WebP.
 * The two that show what the app is for: browsing cafes and finding them. */
const SCREENS = [
  { src: "/app-screens/1-home.webp", alt: "Nook app home: featured cafes and new cafes" },
  { src: "/app-screens/2-map-list.webp", alt: "Nook app map of Cebu with a list of cafes in view" },
] as const;

/**
 * Get-the-app band after the shelves: one warm, rounded band. Headline, what
 * the app adds, the store badges and a small QR on the left; two framed app
 * screens side by side on the right, whole, the second set a little lower.
 * On phones the screens sit under the text.
 */
export default function AppBand() {
  return (
    <section aria-labelledby="app-band" className="pt-16 sm:pt-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-8">
        <div className="grid grid-cols-1 gap-10 overflow-hidden rounded-[28px] bg-paper px-6 pt-10 sm:px-12 sm:pt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12 lg:px-16 lg:pt-0">
          <div className="self-center lg:py-16">
            <h2
              id="app-band"
              className="text-balance text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.02em] text-ink sm:text-4xl"
            >
              Take Nook to the cafe with you
            </h2>
            <p className="mt-3 max-w-[46ch] text-[15px] leading-relaxed text-body sm:text-base">
              The app for iPhone and Android keeps the map in your pocket, saves cafes to Want to
              Try, and ranks the ones you have been to.
            </p>
            <StoreBadges className="mt-6" />
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

          <div className="flex items-start justify-center gap-4 pb-10 sm:gap-6 sm:pb-12 lg:py-12">
            {SCREENS.map((screen, i) => (
              <Image
                key={screen.src}
                src={screen.src}
                alt={screen.alt}
                width={600}
                height={1250}
                sizes="(min-width: 1024px) 240px, 44vw"
                className={`h-auto w-[44%] max-w-[240px] ${i === 1 ? "mt-8 sm:mt-12" : "mb-8 sm:mb-12"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
