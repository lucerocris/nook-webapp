import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CaretRight, ThumbsUp } from "@phosphor-icons/react/dist/ssr";

import Footer from "@/app/components/Footer";
import StoreBadges from "@/app/components/StoreBadges";
import CupAvatar from "@/app/components/cafe/CupAvatar";
import CupKindIcon, { CUP_KIND_LABEL } from "@/app/components/cafe/CupKindIcon";
import CupPageBeacon from "@/app/components/cafe/CupPageBeacon";
import CupShowcase from "@/app/components/cafe/CupShowcase";
import RatingStars from "@/app/components/cafe/RatingStars";
import { visitDay } from "@/app/components/cafe/visit-day";
import { getCupPublic } from "@/lib/data/cups";
import { cupLead, cupPhotoEntries, plural, type PublicCup } from "@/lib/data/cups-mappers";
import { SITE_URL } from "@/lib/env";
import { BASE_OPEN_GRAPH } from "@/lib/seo/metadata";
import { cleanText, snippet } from "@/lib/seo/text";

type Props = { params: Promise<{ id: string }> };

/**
 * Cache Components needs one param to prerender the route; every other id
 * renders on its first visit. The nil UUID is a placeholder: unknown, it
 * prerenders the 404.
 */
export async function generateStaticParams() {
  return [{ id: "00000000-0000-0000-0000-000000000000" }];
}

function titleFor({ cup, cafe }: PublicCup): string {
  const lead = cupLead(cup);
  const name = cleanText(cafe.name);
  return lead ? `${cleanText(lead)} at ${name}` : `A cup at ${name}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const pub = await getCupPublic(id);
  if (!pub) {
    return { title: { absolute: "Cup not found · Nook" }, robots: { index: false } };
  }
  const title = titleFor(pub);
  const description = snippet(
    [pub.cup.rating !== null ? `${pub.cup.rating}/5` : null, pub.cafe.area, "on Nook"]
      .filter(Boolean)
      .join(" · "),
  );
  const url = `/cups/${id}`;
  // The image is opengraph-image.tsx beside this file.
  return {
    title,
    description,
    // A share landing for one person's post, not search content: the
    // cafe's Cups page is the indexable one (SHARE_CUP_STORY §6.2).
    robots: { index: false, follow: true },
    alternates: { canonical: `${SITE_URL}${url}` },
    openGraph: { ...BASE_OPEN_GRAPH, type: "article", title, description, url },
    twitter: { card: "summary_large_image", title, description },
  };
}

/**
 * One cup, `/cups/<id>`: where a cup shared from the app lands
 * (nook-supabase docs/SHARE_CUP_STORY.md §6). Photos on the left (on top on
 * a phone), then what it was, where, the stars and day, the note and who
 * posted it; then the app band and the way to the cafe's other cups.
 * Hidden, removed, deleted and unknown cups are the same real 404: the read
 * is cached, so it decides before anything streams.
 */
export default async function CupPage({ params }: Props) {
  const { id } = await params;
  const pub = await getCupPublic(id);
  if (!pub) notFound();

  const { cup, cafe } = pub;
  const photos = cupPhotoEntries(cup);
  const lead = cupLead(cup);
  const leadItem = lead ? cup.items.find((item) => item.label === lead) : null;
  const without = cup.items.filter((item) => !item.photo && item.label && item.label !== lead);
  const day = visitDay(cup.visitedAt);
  const by = cup.username ? `@${cup.username}` : cup.authorName;

  return (
    <>
      <CupPageBeacon cupId={cup.id} cafeId={cafe.id} />
      <main className="flex-1 pt-20 pb-12 sm:pt-24 lg:pt-28">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-8">
          <div
            className={
              photos.length > 0
                ? "grid gap-8 lg:grid-cols-[minmax(0,480px)_minmax(0,1fr)] lg:gap-14"
                : "max-w-2xl"
            }
          >
            {photos.length > 0 ? <CupShowcase photos={photos} cafeName={cafe.name} /> : null}

            <div className="min-w-0 lg:pt-2">
              <h1 className="text-[1.75rem] leading-tight font-semibold tracking-[-0.02em] text-balance text-ink sm:text-[2rem]">
                {lead ?? "A cup"}
              </h1>
              {leadItem?.kind ? (
                <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted">
                  <CupKindIcon kind={leadItem.kind} size={15} className="text-fern" />
                  {CUP_KIND_LABEL[leadItem.kind]}
                </p>
              ) : null}

              <Link
                href={`/cafes/${cafe.id}`}
                className="group mt-5 flex w-fit max-w-full items-center gap-1 rounded-md text-[15px] font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <span className="text-muted font-normal">at</span>
                <span className="truncate underline-offset-4 group-hover:underline">{cafe.name}</span>
                <CaretRight size={14} aria-hidden className="shrink-0" />
              </Link>
              {cafe.area ? <p className="mt-0.5 text-sm text-muted">{cafe.area}</p> : null}

              <div className="mt-4 flex items-center gap-2 text-sm text-muted">
                {cup.rating !== null ? (
                  <>
                    <RatingStars rating={cup.rating} size={15} />
                    <span className="sr-only">{cup.rating} out of 5.</span>
                    {day ? <span aria-hidden>·</span> : null}
                  </>
                ) : null}
                {day ? <span>{day}</span> : null}
              </div>

              {cup.note ? (
                <p className="mt-4 max-w-[65ch] text-base leading-7 break-words whitespace-pre-line text-body">
                  {cup.note}
                </p>
              ) : null}

              {without.length > 0 ? (
                <div className="mt-5">
                  <p className="text-sm text-muted">Also had</p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {without.map((item) => (
                      <li
                        key={item.id}
                        className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-paper px-3 py-1.5 text-sm font-medium text-ink"
                      >
                        {item.kind ? (
                          <CupKindIcon kind={item.kind} size={14} className="shrink-0 text-fern" />
                        ) : null}
                        <span className="truncate">{item.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-5">
                {cup.username ? (
                  <Link
                    href={`/u/${cup.username}`}
                    className="group flex min-h-11 items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    <CupAvatar name={cup.authorName} url={cup.avatarUrl} size={32} />
                    <span className="text-sm text-body">
                      <span className="font-semibold text-ink underline-offset-4 group-hover:underline">{by}</span>{" "}
                      on Nook
                    </span>
                  </Link>
                ) : (
                  <span className="flex min-h-11 items-center gap-2.5 text-sm text-body">
                    <CupAvatar name={cup.authorName} url={cup.avatarUrl} size={32} />
                    {by} on Nook
                  </span>
                )}
                {cup.helpfulCount > 0 ? (
                  <span className="flex items-center gap-1.5 text-xs text-muted tabular-nums">
                    <ThumbsUp size={14} aria-hidden />
                    Helpful · {cup.helpfulCount.toLocaleString("en-US")}
                    <span className="sr-only">
                      {" "}
                      ({plural(cup.helpfulCount, "person", "people")} found this helpful)
                    </span>
                  </span>
                ) : null}
              </div>

              <section
                aria-labelledby="get-nook"
                className="mt-8 rounded-[var(--radius-card)] bg-paper p-6"
              >
                <h2 id="get-nook" className="text-lg font-semibold tracking-[-0.01em] text-ink">
                  Find your next cafe on Nook
                </h2>
                <p className="mt-1 text-sm text-body">Free on the App Store and Google Play.</p>
                <StoreBadges placement="cup_page" size="sm" className="mt-4" />
              </section>

              <Link
                href={`/cafes/${cafe.id}/cups`}
                className="mt-6 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-ink underline-offset-4 hover:underline"
              >
                More cups at {cafe.name}
                <CaretRight size={14} aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
