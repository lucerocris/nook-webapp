import Image from "next/image";

import ShareButton from "@/app/components/ShareButton";
import type { PublicProfile } from "@/lib/data/profiles";

/** "18 cafes ranked · 4 reviews · 11 cups". Hidden or zero parts are left
 * out, except reviews. */
export function countsLine(counts: PublicProfile["counts"]): string {
  const { ranked, reviews, cups } = counts;
  return [
    ranked ? `${ranked} ${ranked === 1 ? "cafe" : "cafes"} ranked` : null,
    `${reviews} ${reviews === 1 ? "review" : "reviews"}`,
    cups ? `${cups} ${cups === 1 ? "cup" : "cups"}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

/**
 * Who the profile belongs to: avatar on the left; name, @handle and the
 * counts beside it; the bio under them (Tripadvisor's header row, with
 * Instagram's counts-then-bio order; docs/references/public-profile).
 * Share sits at the right where a Follow button would go later.
 */
export default function ProfileHeader({ profile }: { profile: PublicProfile }) {
  return (
    <header className="flex flex-col gap-4">
      <div className="flex items-center gap-4 sm:gap-6">
        <Avatar name={profile.name} url={profile.avatarUrl} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold tracking-[-0.02em] text-ink sm:text-[2rem] sm:leading-tight">
            {profile.name}
          </h1>
          <p className="truncate text-sm text-muted">@{profile.username}</p>
          <p className="mt-1 text-sm text-body tabular-nums">{countsLine(profile.counts)}</p>
        </div>
        <div className="shrink-0 sm:hidden">
          <ShareButton title={`${profile.name} on Nook`} text={`${profile.name}'s cafes on Nook`}
            ariaLabel="Share profile"
          />
        </div>
        <div className="hidden shrink-0 sm:block">
          <ShareButton
            title={`${profile.name} on Nook`}
            text={`${profile.name}'s cafes on Nook`}
            label="Share"
            ariaLabel="Share profile"
          />
        </div>
      </div>
      {profile.bio ? (
        <p className="max-w-[60ch] text-[15px] leading-relaxed text-body">{profile.bio}</p>
      ) : null}
    </header>
  );
}

function Avatar({ name, url }: { name: string; url: string | null }) {
  const box = "relative size-20 shrink-0 overflow-hidden rounded-full sm:size-24";
  if (url) {
    return (
      <span className={`${box} bg-subtle`}>
        <Image src={url} alt="" fill sizes="96px" className="object-cover" priority />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className={`${box} flex items-center justify-center bg-timberwolf text-2xl font-semibold text-ink sm:text-3xl`}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
