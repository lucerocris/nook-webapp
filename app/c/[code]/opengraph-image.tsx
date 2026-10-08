import { CARD_SIZE, renderCrawlCard } from "@/app/components/crawl/crawlCard";
import { getPublicCrawl } from "@/lib/data/crawls";

export const alt = "Cafe crawl on Nook: the title and its stops in order";
export const size = CARD_SIZE;
export const contentType = "image/png";

/** The link preview for /c/<code>; see renderCrawlCard. */
export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return renderCrawlCard(await getPublicCrawl(code), null);
}
