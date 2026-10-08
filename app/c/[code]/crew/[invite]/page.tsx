import type { Metadata } from "next";
import { notFound } from "next/navigation";

import CrawlLanding from "@/app/components/crawl/CrawlLanding";
import { crawlMetadata } from "@/app/components/crawl/crawlMetadata";
import { getCrewInvite, getPublicCrawl } from "@/lib/data/crawls";

type Props = { params: Promise<{ code: string; invite: string }> };

export async function generateStaticParams() {
  return [{ code: "00000000", invite: "0000000000" }];
}

async function load(code: string, inviteCode: string) {
  const [crawl, invite] = await Promise.all([getPublicCrawl(code), getCrewInvite(code, inviteCode)]);
  return { crawl, invite };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code, invite: inviteCode } = await params;
  const { crawl, invite } = await load(code, inviteCode);
  const shareCode = crawl?.shareCode ?? invite?.shareCode ?? code;
  const url = invite ? `/c/${shareCode}?crew=${invite.inviteCode}` : `/c/${shareCode}`;
  return crawlMetadata(crawl, invite, url);
}

/**
 * `/c/<code>?crew=<invite>`, reached through the rewrite in proxy.ts: the
 * crawl led by "@starter invited you to their crew". An invite that is
 * unknown or belongs to another crawl falls back to the plain crawl; with
 * neither readable it is a 404. A valid invite to a private or archived
 * crawl shows the invite alone (title, stop count, crew size), which is all
 * the preview RPC hands out.
 */
export default async function CrewInvitePage({ params }: Props) {
  const { code, invite: inviteCode } = await params;
  const { crawl, invite } = await load(code, inviteCode);
  if (!crawl && !invite) notFound();
  return <CrawlLanding crawl={crawl} invite={invite} />;
}
