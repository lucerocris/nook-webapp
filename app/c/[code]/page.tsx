import type { Metadata } from "next";
import { notFound } from "next/navigation";

import CrawlLanding from "@/app/components/crawl/CrawlLanding";
import { crawlMetadata } from "@/app/components/crawl/crawlMetadata";
import { getPublicCrawl } from "@/lib/data/crawls";

type Props = { params: Promise<{ code: string }> };

/**
 * Cache Components needs one param to prerender the route; every other code
 * renders on its first visit. "00000000" is a placeholder: unknown, it
 * prerenders the 404.
 */
export async function generateStaticParams() {
  return [{ code: "00000000" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const crawl = await getPublicCrawl(code);
  return crawlMetadata(crawl, null, `/c/${crawl?.shareCode ?? code}`);
}

/**
 * A shared crawl, `/c/<code>`, as the app's "Share crawl" sends it. A link
 * with `?crew=<invite>` is rewritten by proxy.ts to the crew page beside
 * this one, so the invite is a path param there and both pages can decide
 * 404 before anything streams. Unknown, private, archived and removed crawls
 * are the same real 404: the RPC returns null for all of them.
 */
export default async function CrawlPage({ params }: Props) {
  const { code } = await params;
  const crawl = await getPublicCrawl(code);
  if (!crawl) notFound();
  return <CrawlLanding crawl={crawl} invite={null} />;
}
