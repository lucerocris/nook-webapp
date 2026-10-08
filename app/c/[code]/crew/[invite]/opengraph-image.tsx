import { CARD_SIZE, renderCrawlCard } from "@/app/components/crawl/crawlCard";
import { getCrewInvite, getPublicCrawl } from "@/lib/data/crawls";

export const alt = "Crew invite on Nook: the crawl, who invited you and how full the crew is";
export const size = CARD_SIZE;
export const contentType = "image/png";

/** The link preview for /c/<code>?crew=<invite> (rewritten here by proxy.ts). */
export default async function Image({
  params,
}: {
  params: Promise<{ code: string; invite: string }>;
}) {
  const { code, invite } = await params;
  const [crawl, preview] = await Promise.all([getPublicCrawl(code), getCrewInvite(code, invite)]);
  return renderCrawlCard(crawl, preview);
}
