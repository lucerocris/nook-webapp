import { AppleLogo, GooglePlayLogo } from "@phosphor-icons/react/dist/ssr";

import { APP_STORE_URL, PLAY_STORE_URL } from "@/lib/app-links";
import { cn } from "@/lib/utils";

/** App Store and Google Play buttons side by side. If PLAY_STORE_URL is ever
 * unset, the Android badge falls back to a muted "coming soon" rather than a
 * dead link. */
export default function StoreBadges({
  size = "md",
  tone = "light",
  className,
}: {
  size?: "sm" | "md";
  /** "dark": for the dark-green band — white badge, timberwolf pending note. */
  tone?: "light" | "dark";
  className?: string;
}) {
  const live =
    tone === "dark"
      ? "bg-white text-ink hover:bg-timberwolf [&_.badge-kicker]:text-muted"
      : "bg-ink text-white hover:bg-brand [&_.badge-kicker]:text-white/70";
  const pending =
    tone === "dark"
      ? "border border-dashed border-timberwolf/50 text-timberwolf"
      : "border border-dashed border-line-strong text-muted";
  const box =
    size === "sm"
      ? "h-11 gap-2 rounded-xl px-3.5"
      : "h-14 gap-3 rounded-2xl px-5";
  const icon = size === "sm" ? 20 : 26;

  return (
    <div className={cn("flex flex-wrap gap-2.5", className)}>
      <a
        href={APP_STORE_URL}
        target="_blank"
        rel="noreferrer"
        className={cn(
          "flex items-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand", live,
          box,
        )}
      >
        <AppleLogo size={icon} weight="fill" className="shrink-0" />
        <span className="text-left leading-tight">
          <span className="badge-kicker block text-[10px] font-medium">
            Download on the
          </span>
          <span className={cn("block font-semibold", size === "sm" ? "text-sm" : "text-base")}>
            App Store
          </span>
        </span>
      </a>

      {PLAY_STORE_URL ? (
        <a
          href={PLAY_STORE_URL}
          target="_blank"
          rel="noreferrer"
          className={cn(
            "flex items-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand", live,
            box,
          )}
        >
          <GooglePlayLogo size={icon} weight="fill" className="shrink-0" />
          <span className="text-left leading-tight">
            <span className="badge-kicker block text-[10px] font-medium">Get it on</span>
            <span className={cn("block font-semibold", size === "sm" ? "text-sm" : "text-base")}>
              Google Play
            </span>
          </span>
        </a>
      ) : (
        <span
          className={cn(
            "flex items-center", pending,
            box,
          )}
        >
          <GooglePlayLogo size={icon} className="shrink-0" />
          <span className="text-left leading-tight">
            <span className="block text-[10px] font-medium">Android</span>
            <span className={cn("block font-semibold", size === "sm" ? "text-sm" : "text-base")}>
              Coming soon
            </span>
          </span>
        </span>
      )}
    </div>
  );
}
