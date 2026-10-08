import type { Metadata } from "next";

import type { CrewInvite, PublicCrawl } from "@/lib/data/crawls";
import { formatDistance } from "@/lib/utils/format";

function clip(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/**
 * Title, description and link-preview tags for a shared crawl. Always
 * noindex: link crawls are unlisted, not public (COMMUNITY_CRAWLS.md §5).
 * The preview image is the route's opengraph-image.tsx, which Next adds as
 * og:image; Twitter falls back to it.
 */
export function crawlMetadata(
  crawl: PublicCrawl | null,
  invite: CrewInvite | null,
  url: string,
): Metadata {
  if (!crawl && !invite) {
    return { title: { absolute: "Crawl not found · Nook" }, robots: { index: false, follow: false } };
  }
  const name = crawl?.title ?? invite?.title ?? "A cafe crawl";
  const stops = crawl?.stops ?? [];
  const stopNames = stops.map((s) => s.name);
  const count = crawl ? stops.length : (invite?.stopCount ?? 0);
  const route =
    stopNames.length > 0
      ? `${count} cafes: ${clip(stopNames.join(", "), 120)}.`
      : `${count} cafes.`;
  const km = crawl?.routeMeters ? ` ${formatDistance(crawl.routeMeters)} stop to stop.` : "";

  const title = invite
    ? `Join ${invite.starter ? `@${invite.starter.username}'s` : "a"} crew: ${name} · Nook`
    : `${name}, a cafe crawl · Nook`;
  const lead = invite
    ? `${invite.starter ? `@${invite.starter.username}` : "Someone"} invited you to a cafe crawl in Cebu on Nook.`
    : `A cafe crawl in Cebu${crawl?.creator ? ` by @${crawl.creator.username}` : ""} on Nook.`;
  const description = clip(`${lead} ${route}${km}`, 200);

  return {
    title: { absolute: title },
    description,
    robots: { index: false, follow: true },
    alternates: { canonical: url },
    openGraph: { type: "website", siteName: "Nook", title, description, url },
    twitter: { card: "summary_large_image", title, description },
  };
}
