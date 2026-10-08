import Image from "next/image";

import StoreBadges from "@/app/components/StoreBadges";

/**
 * The end of a shared profile, for visitors without the app (Perplexity's
 * get-the-app card: headline and one line, the app row, then the badges, and
 * a QR beside it on desktop; SoundCloud's badge pair; docs/references/
 * public-profile). No rating or download count: there is no real one to show.
 */
export default function ProfileAppBand({
  heading = "Keep your own coffee gallery",
  body = "Snap your cup at every cafe, review the ones you work from and rank where you have been. Free for iPhone and Android.",
}: {
  heading?: string;
  body?: string;
} = {}) {
  return (
    <section
      aria-labelledby="get-app"
      className="mt-12 grid gap-6 rounded-[28px] bg-paper px-6 py-8 sm:mt-16 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-10 sm:py-10"
    >
      <div>
        <div className="flex items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-white shadow-raise">
            <Image src="/nookGlasses.svg" alt="" width={32} height={32} unoptimized />
          </span>
          <span className="leading-tight">
            <span className="block text-[15px] font-semibold text-ink">Nook</span>
            <span className="block text-[13px] text-muted">Cafes in Cebu</span>
          </span>
        </div>
        <h2 id="get-app" className="mt-5 text-balance text-xl leading-snug font-semibold tracking-[-0.01em] text-ink sm:text-2xl">
          {heading}
        </h2>
        <p className="mt-2 max-w-[48ch] text-[15px] leading-relaxed text-body">
          {body}
        </p>
        <StoreBadges size="sm" className="mt-5" />
      </div>
      <div className="hidden flex-col items-center gap-2 sm:flex">
        <div className="rounded-2xl bg-white p-3 shadow-raise">
          <Image
            src="/app-store-qr.svg"
            alt="QR code linking to Nook on the App Store"
            width={104}
            height={104}
            unoptimized
          />
        </div>
        <p className="max-w-[18ch] text-center text-[13px] text-muted">Scan with your iPhone</p>
      </div>
    </section>
  );
}
