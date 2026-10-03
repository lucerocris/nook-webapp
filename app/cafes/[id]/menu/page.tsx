import { Suspense } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import CafeDetailSkeleton from "@/app/components/CafeDetailSkeleton";
import MenuCategoryNav from "@/app/components/cafe/MenuCategoryNav";
import { getCafeById, getMenuItems } from "@/lib/data/cafes";
import { formatPrice } from "@/lib/utils/format";
import { SITE_URL as siteUrl } from "@/lib/env";
import type { MenuItem, MenuItemVariant } from "@/lib/data/cafes-mappers";

type Props = {
  params: Promise<{ id: string }>;
};

const UNCATEGORIZED = "More";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const cafe = await getCafeById(id);

  if (!cafe) {
    return { title: "Menu", robots: { index: false } };
  }

  return {
    title: `${cafe.name} menu`,
    description: `Drinks, food and prices at ${cafe.name}.`,
    alternates: { canonical: `${siteUrl}/cafes/${id}/menu` },
  };
}

export default async function CafeMenuPage({ params }: Props) {
  return (
    <Suspense fallback={<CafeDetailSkeleton />}>
      <CafeMenuRender params={params} />
    </Suspense>
  );
}

async function CafeMenuRender({ params }: Props) {
  const { id } = await params;
  const [cafe, items] = await Promise.all([getCafeById(id), getMenuItems(id)]);

  if (!cafe) {
    notFound();
  }

  const sections = groupByCategory(items);
  const categories = sections.map((section) => ({
    key: section.key,
    title: section.title,
    count: section.items.length,
  }));

  return (
    <>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-24 pb-16 sm:px-8">
        <p className="text-sm text-muted">{cafe.name}</p>
        <h1 className="mt-1 text-[1.75rem] font-semibold tracking-[-0.02em] text-ink sm:text-[2rem]">
          Menu
        </h1>

        {items.length === 0 ? (
          <p className="mt-10 border-y border-line py-12 text-center text-sm text-muted">
            This cafe hasn&apos;t listed its menu yet.
          </p>
        ) : (
          <div className="mt-6 lg:mt-10 lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-12">
            <MenuCategoryNav categories={categories} />

            <div className="min-w-0">
              {sections.map((section) => (
                <section
                  key={section.key}
                  id={`cat-${section.key}`}
                  className="scroll-mt-32 pt-8 first:pt-6 lg:scroll-mt-24 lg:first:pt-0"
                >
                  <h2 className="text-lg font-semibold tracking-[-0.01em] text-ink">
                    {section.title}
                  </h2>
                  <p className="text-sm text-muted">
                    {section.items.length} {section.items.length === 1 ? "item" : "items"}
                  </p>

                  <ul className="mt-4 grid gap-3 md:grid-cols-2">
                    {section.items.map((item) => (
                      <li key={item.id}>
                        <MenuItemCard item={item} />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}

/** Text-first card: name (with a Highlight tag when flagged), description,
 * sizes as label + price pairs, and a square photo on the right only when the
 * item has one. Cards without a photo keep the same minimum height. */
function MenuItemCard({ item }: { item: MenuItem }) {
  const variants = sortedVariants(item);
  return (
    <article className="flex h-full min-h-[7.5rem] gap-4 rounded-2xl border border-line p-4">
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-ink">
          {item.name}
          {item.isHighlight ? (
            <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand">
              Highlight
            </span>
          ) : null}
        </h3>
        {item.description ? (
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">
            {item.description}
          </p>
        ) : null}
        <div className="mt-auto pt-3">
          {variants.length > 1 ? (
            <dl className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {variants.map((variant) => (
                <div key={variant.id} className="flex gap-1.5">
                  <dt className="text-muted">{variant.label}</dt>
                  <dd className="font-medium text-ink">
                    {formatPrice(variantPrice(item, variant))}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm font-medium text-ink">
              {formatPrice(displayPrice(item))}
            </p>
          )}
        </div>
      </div>
      {item.imageUrl ? (
        <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-subtle sm:size-28">
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="112px"
            className="object-cover"
          />
        </div>
      ) : null}
    </article>
  );
}

function variantPrice(item: MenuItem, variant: MenuItemVariant) {
  return variant.priceOverride ?? item.price + variant.priceModifier;
}

/** The price to headline for an item. `menu_items.price` is the base, but a
 * variant flagged is_default can carry a price_override — without this an item
 * whose default Small overrides to 120 headlines its base of 0 as "P0.00"
 * right next to "Small P120.00". */
function displayPrice(item: MenuItem) {
  const preferred =
    item.variants.find((variant) => variant.isDefault) ?? null;
  return preferred ? variantPrice(item, preferred) : item.price;
}

/** menu_item_variants has a sort_order that the mapper reads and nothing used,
 * and the RPC aggregates variants without a stable tiebreak — so sizes could
 * render "Large · Small · Medium" on one request and differently on the next,
 * then freeze that way for the life of the cache entry. */
function sortedVariants(item: MenuItem): MenuItemVariant[] {
  return [...item.variants].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label),
  );
}

// get_menu_items has no ORDER BY, so row order is whatever Postgres happens to
// return and can differ between calls. Sort here to keep sections and items
// stable — categories alphabetically, uncategorised last.
function groupByCategory(items: MenuItem[]) {
  type Section = { key: string; title: string; items: MenuItem[] };
  const sections = new Map<string, Section>();

  for (const item of items) {
    const key = item.categoryId ?? UNCATEGORIZED;
    let section = sections.get(key);
    if (!section) {
      section = { key, title: item.categoryName ?? UNCATEGORIZED, items: [] };
      sections.set(key, section);
    }
    section.items.push(item);
  }

  for (const section of sections.values()) {
    section.items.sort((a, b) => a.name.localeCompare(b.name));
  }

  return [...sections.values()].sort((a, b) => {
    if (a.key === UNCATEGORIZED) return 1;
    if (b.key === UNCATEGORIZED) return -1;
    return a.title.localeCompare(b.title);
  });
}
