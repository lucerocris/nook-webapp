import Image from "next/image";

import GetAppButton from "@/app/components/profile/GetAppButton";
import ShareButton from "@/app/components/ShareButton";
import type { PublicProfile } from "@/lib/data/profiles";

/** "8 cups · 4 reviews · 6 cafes ranked", for meta descriptions. Hidden and
 * zero parts are left out, except reviews. */
export function countsLine(counts: PublicProfile["counts"]): string {
  const { ranked, reviews, cups } = counts;
  return [
    cups ? `${cups} ${cups === 1 ? "cup" : "cups"}` : null,
    `${reviews} ${reviews === 1 ? "review" : "reviews"}`,
    ranked ? `${ranked} ${ranked === 1 ? "cafe" : "cafes"} ranked` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

/**
 * Who this is, centred (the app's profile v2 header; Windy's count row,
 * Pinterest's letter avatar and pill pair; docs/references/public-profile):
 * avatar, name, @handle, then Ranked · Reviews · Cups as equal columns, the
 * bio, and two actions. With the gallery switched off only Reviews is
 * counted: ranked and cups are not sent.
 */
export default function ProfileHeader({ profile }: { profile: PublicProfile }) {
  const { counts } = profile;
  const stats = [
    counts.ranked !== null ? { label: "Ranked", value: counts.ranked } : null,
    { label: counts.reviews === 1 ? "Review" : "Reviews", value: counts.reviews },
    counts.cups !== null ? { label: counts.cups === 1 ? "Cup" : "Cups", value: counts.cups } : null,
  ].filter((s): s is { label: string; value: number } => s !== null);

  return (
    <header className="flex flex-col items-center text-center">
      <Avatar name={profile.name} url={profile.avatarUrl} />
      <h1 className="mt-4 max-w-full text-balance break-words text-2xl leading-tight font-semibold tracking-[-0.02em] text-ink sm:text-[1.75rem]">
        {profile.name}
      </h1>
      {profile.hasName ? (
        <p className="mt-0.5 max-w-full truncate text-sm text-muted">@{profile.username}</p>
      ) : null}

      <dl
        className="mt-5 grid w-full max-w-xs"
        style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}
      >
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col-reverse items-center">
            <dt className="text-[13px] text-muted">{s.label}</dt>
            <dd className="text-lg leading-snug font-semibold text-ink tabular-nums">
              {s.value.toLocaleString("en-US")}
            </dd>
          </div>
        ))}
      </dl>

      {profile.bio ? (
        <p className="mt-4 max-w-[44ch] text-[15px] leading-relaxed break-words whitespace-pre-line text-body">
          {profile.bio}
        </p>
      ) : null}

      <div className="mt-5 flex items-center gap-2">
        <GetAppButton />
        <ShareButton
          title={`${profile.name} on Nook`}
          text={`${profile.name}'s cafes and coffee on Nook`}
          label="Share"
          ariaLabel="Share profile"
          className="h-11 rounded-full border border-line-strong bg-white px-5 hover:bg-subtle hover:no-underline"
        />
      </div>
    </header>
  );
}

function Avatar({ name, url }: { name: string; url: string | null }) {
  const box = "relative size-24 shrink-0 overflow-hidden rounded-full sm:size-28";
  if (url) {
    return (
      <span className={`${box} bg-subtle`}>
        <Image src={url} alt="" fill sizes="112px" className="object-cover" priority />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className={`${box} flex items-center justify-center bg-timberwolf text-4xl font-medium text-ink`}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
