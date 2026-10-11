import { createElement, Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CaretLeft } from "@phosphor-icons/react/dist/ssr";

import CafeDetailSkeleton from "@/app/components/CafeDetailSkeleton";
import Footer from "@/app/components/Footer";
import { getCafeById } from "@/lib/data/cafes";
import { SITE_URL as siteUrl } from "@/lib/env";
import { cafeShareMetadata } from "@/lib/seo/metadata";
import type { Tag } from "@/lib/data/cafes-mappers";
import { coffeeTagHint, groupCafeTags, tagSections } from "@/lib/utils/coffee-tags";
import { getTagIcon } from "@/lib/utils/tag-icon";

type Props = {
  params: Promise<{ id: string }>;
};

/** Everything a cafe offers, from "See all N" on the cafe page. A page, not a
 * dialog, so it has its own URL to share and index, and Back does what people
 * expect. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const cafe = await getCafeById(id, { includeReviews: false });

  if (!cafe) {
    return { title: "What this cafe offers", robots: { index: false } };
  }

  const sample = tagSections(groupCafeTags(cafe.tags))
    .flatMap((s) => s.tags)
    .slice(0, 5)
    .map((t) => t.name);

  const title = `What ${cafe.name} offers`;
  const description = sample.length
    ? `${sample.join(", ")} and more at ${cafe.name}, on Nook.`
    : `Coffee, amenities and payment options at ${cafe.name}, on Nook.`;
  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}/cafes/${id}/offers` },
    ...cafeShareMetadata({ title, description, path: `/cafes/${id}/offers`, cafe }),
  };
}

export default async function CafeOffersPage({ params }: Props) {
  return (
    <Suspense fallback={<CafeDetailSkeleton />}>
      <CafeOffersRender params={params} />
    </Suspense>
  );
}

async function CafeOffersRender({ params }: Props) {
  const { id } = await params;
  const cafe = await getCafeById(id, { includeReviews: false });

  if (!cafe) {
    notFound();
  }

  const sections = tagSections(groupCafeTags(cafe.tags));

  return (
    <>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-24 pb-16 sm:px-8 lg:pt-28">
        <Link
          href={`/cafes/${id}`}
          className="inline-flex min-h-11 max-w-full items-center gap-1.5 text-sm font-medium text-body transition-colors hover:text-ink"
        >
          <CaretLeft size={16} weight="bold" className="shrink-0" />
          <span className="truncate">{cafe.name}</span>
        </Link>
        <h1 className="mt-2 text-[1.75rem] font-semibold tracking-[-0.02em] text-ink sm:text-[2rem]">
          What this cafe offers
        </h1>

        <div className="max-w-3xl">
          {sections.length === 0 ? (
            <p className="mt-10 border-y border-line py-12 text-center text-sm text-muted">
              Nothing listed for this cafe yet.
            </p>
          ) : (
            sections.map((section) => (
              <TagSection
                key={section.title}
                title={section.title}
                tags={section.tags}
                withHints={section.title === "Coffee"}
              />
            ))
          )}
        </div>
      </main>

      <div className="hidden lg:block">
        <Footer />
      </div>
    </>
  );
}

/** A group heading over icon + label rows split by hairlines; two columns
 * from `md` so a long Amenities list uses the width. Coffee rows carry one
 * line on what the tag means. */
function TagSection({
  title,
  tags,
  withHints,
}: {
  title: string;
  tags: Tag[];
  withHints: boolean;
}) {
  return (
    <section className="mt-10 first-of-type:mt-8">
      <h2 className="text-lg font-semibold tracking-[-0.01em] text-ink">{title}</h2>
      <ul className="mt-2 grid md:grid-cols-2 md:gap-x-10">
        {tags.map((tag) => {
          const hint = withHints ? coffeeTagHint(tag.name) : null;
          return (
            <li
              key={tag.id}
              className="flex min-w-0 items-start gap-4 border-b border-line py-4"
            >
              {createElement(getTagIcon(tag.name), {
                size: 24,
                className: "mt-px shrink-0 text-ink",
                "aria-hidden": true,
              })}
              <div className="min-w-0">
                <p className="text-base text-ink">{tag.name}</p>
                {hint ? <p className="mt-0.5 text-sm text-muted">{hint}</p> : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
