import Image from "next/image";
import { MapPin, Path, Flag, UsersThree, CalendarBlank } from "@phosphor-icons/react/dist/ssr";

import GetAppButton from "@/app/components/profile/GetAppButton";
import type { CrewInvite, PublicCrawl } from "@/lib/data/crawls";
import { formatDistance } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

/** "Sat, Oct 11" from a `date` column ("2026-10-11"), read as a calendar day
 * so no time zone can move it. */
export function plannedLabel(date: string | null): string | null {
  if (!date) return null;
  const [y, m, d] = date.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

export function stopsLabel(n: number): string {
  return `${n} ${n === 1 ? "stop" : "stops"}`;
}

/**
 * The top of a shared crawl (Luma's invite header: context chip, title, "by"
 * line with a mini avatar, then one fact row under a hairline; Cake's pill
 * over a large title; docs/references/crawl-link). With a crew invite it
 * leads with who invited you and how full the crew is.
 *
 * `crawl` is null when only the invite is readable (the crawl itself is
 * private or archived): then the title and stop count come from the invite.
 */
export default function CrawlHeader({
  crawl,
  invite,
}: {
  crawl: PublicCrawl | null;
  invite: CrewInvite | null;
}) {
  const title = crawl?.title ?? invite?.title ?? "";
  const stopCount = crawl?.stops.length ?? invite?.stopCount ?? 0;
  const full = invite ? invite.crewSize >= invite.crewLimit : false;
  const planned = plannedLabel(invite?.plannedFor ?? null);

  const facts = [
    { icon: MapPin, text: stopsLabel(stopCount) },
    crawl?.routeMeters
      ? { icon: Path, text: `${formatDistance(crawl.routeMeters)} stop to stop` }
      : null,
    crawl && crawl.runsStarted > 0
      ? {
          icon: Flag,
          text:
            crawl.completions > 0
              ? `${crawl.completions} finished`
              : `${crawl.runsStarted} ${crawl.runsStarted === 1 ? "crew" : "crews"} started`,
        }
      : null,
  ].filter((f): f is { icon: typeof MapPin; text: string } => f !== null);

  return (
    <header>
      <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-line-strong px-3 text-[13px] font-medium text-body">
        {invite ? <UsersThree size={15} aria-hidden /> : <Path size={15} aria-hidden />}
        {invite ? "Crew invite" : "Cafe crawl"}
      </span>

      {invite ? (
        <p className="mt-4 flex min-w-0 items-center gap-2 text-[15px] text-body">
          <Avatar name={invite.starter?.username ?? "?"} url={invite.starter?.avatarUrl ?? null} size={28} />
          <span className="min-w-0 break-words">
            {invite.starter ? (
              <>
                <span className="font-semibold text-ink">@{invite.starter.username}</span> invited you to
                their crew
              </>
            ) : (
              "You're invited to a crew"
            )}
          </span>
        </p>
      ) : null}

      <h1
        className={cn(
          "text-balance break-words text-[28px] leading-[1.15] font-semibold tracking-[-0.02em] text-ink sm:text-[40px]",
          invite ? "mt-2" : "mt-4",
        )}
      >
        {title}
      </h1>

      {crawl?.creator && !(invite && invite.starter?.username === crawl.creator.username) ? (
        <p className="mt-2 flex min-w-0 items-center gap-2 text-sm text-muted">
          <Avatar name={crawl.creator.username} url={crawl.creator.avatarUrl} size={20} />
          <span className="min-w-0 truncate">A crawl by @{crawl.creator.username}</span>
        </p>
      ) : null}

      {crawl?.description ? (
        <p className="mt-4 max-w-[52ch] text-[15px] leading-relaxed break-words whitespace-pre-line text-body">
          {crawl.description}
        </p>
      ) : null}

      <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-4 text-sm text-body">
        {facts.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-1.5 tabular-nums">
            <Icon size={18} className="text-fern" aria-hidden />
            {text}
          </li>
        ))}
        {planned ? (
          <li className="flex items-center gap-1.5">
            <CalendarBlank size={18} className="text-fern" aria-hidden />
            Planned for {planned}
          </li>
        ) : null}
      </ul>

      {invite ? <CrewRow invite={invite} /> : null}

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <GetAppButton label={invite && !full ? "Get Nook to join" : "Get Nook"} />
        <a
          href="#join"
          className="flex h-11 items-center rounded-full border border-line-strong bg-white px-5 text-sm font-medium text-ink transition-colors hover:bg-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          I have Nook
        </a>
      </div>
    </header>
  );
}

/** How full the crew is: one slot per place, filled for each member. The
 * server sends a count, not the members, so the slots carry no faces. */
function CrewRow({ invite }: { invite: CrewInvite }) {
  const { crewSize, crewLimit } = invite;
  const full = crewSize >= crewLimit;
  return (
    <div className="mt-4 flex items-center gap-3 rounded-2xl bg-paper px-4 py-3">
      <span className="flex shrink-0 gap-1" aria-hidden>
        {Array.from({ length: crewLimit }, (_, i) => (
          <span
            key={i}
            className={cn(
              "size-2.5 rounded-full",
              i < crewSize ? "bg-brand" : "border border-line-strong bg-white",
            )}
          />
        ))}
      </span>
      <span className="min-w-0 text-sm text-body">
        <span className="font-semibold text-ink tabular-nums">
          {crewSize} of {crewLimit}
        </span>{" "}
        {full ? "joined. This crew is full." : "joined so far"}
      </span>
    </div>
  );
}

function Avatar({ name, url, size }: { name: string; url: string | null; size: number }) {
  const style = { width: size, height: size };
  if (url) {
    return (
      <span className="relative shrink-0 overflow-hidden rounded-full bg-subtle" style={style}>
        <Image src={url} alt="" fill sizes={`${size}px`} className="object-cover" />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      style={{ ...style, fontSize: Math.round(size * 0.45) }}
      className="flex shrink-0 items-center justify-center rounded-full bg-timberwolf font-medium text-ink"
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
