import { Suspense } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import CafeDetailSkeleton from "@/app/components/CafeDetailSkeleton";
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

  const highlights = items.filter((item) => item.isHighlight);
  const sections = groupByCategory(items);

  return (
    <main className="mx-auto mt-20 mb-16 w-full max-w-5xl px-6">
      <h1 className="text-4xl font-semibold text-[#2f2f2f]">Menu</h1>

      {items.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500">No menu items listed yet.</p>
      ) : null}

      {highlights.length > 0 ? (
        <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
          {highlights.map((item) => (
            <li key={item.id}>
              <HighlightThumbnail item={item} />
              <h2 className="mt-3 text-base font-semibold text-[#101514]">
                {item.name}
              </h2>
              <p className="mt-1 text-sm text-[#6b6b6b]">
                {formatPrice(displayPrice(item))}
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      {sections.map((section, index) => (
        <section key={section.key} className={index === 0 ? "mt-12" : "mt-10"}>
          <h2 className="text-lg font-semibold text-[#101514]">
            {section.title}
          </h2>

          <ul className="mt-3">
            {section.items.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-6 border-b border-black/8 py-4 last:border-b-0"
              >
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-[#101514]">
                    {item.name}
                  </h3>
                  {item.description ? (
                    <p className="mt-1 text-xs leading-5 text-[#6b6b6b]">
                      {item.description}
                    </p>
                  ) : null}
                  {item.variants.length > 0 ? (
                    <p className="mt-2 text-xs text-[#6b6b6b]">
                      {sortedVariants(item)
                        .map(
                          (variant) =>
                            `${variant.label} ${formatPrice(
                              variantPrice(item, variant),
                            )}`,
                        )
                        .join(" · ")}
                    </p>
                  ) : null}
                </div>

                <p className="shrink-0 text-sm font-semibold text-[#101514]">
                  {formatPrice(displayPrice(item))}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}

function HighlightThumbnail({ item }: { item: MenuItem }) {
  if (!item.imageUrl) {
    return (
      <div className="flex aspect-[1.55/1] items-center justify-center rounded-xl bg-zinc-100 px-2 text-center text-xs text-zinc-400">
        {item.name}
      </div>
    );
  }
  return (
    <div className="relative aspect-[1.55/1] overflow-hidden rounded-xl bg-zinc-100">
      <Image
        src={item.imageUrl}
        alt={item.name}
        fill
        sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
        className="object-cover"
      />
    </div>
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
