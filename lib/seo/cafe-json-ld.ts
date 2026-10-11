import type { CafeDetails } from "@/lib/data/cafes-mappers";
import { jsonLdRating, jsonLdReviewCards, type CafeCups } from "@/lib/data/cups-mappers";
import { SITE_URL } from "@/lib/env";
import { DAY_KEYS, dayLabel, type OperatingHours } from "@/lib/utils/hours";

/** schema.org `CafeOrCoffeeShop` for a cafe detail page — what lets search
 * engines and AI answer engines read the name, address, hours and rating as
 * facts instead of guessing them from layout.
 *
 * Nook is a third-party review site, so `aggregateRating` is allowed here
 * (Google rejects it only when a business rates itself). */
export function cafeJsonLd(cafe: CafeDetails, hours: OperatingHours, cups?: CafeCups) {
  const url = `${SITE_URL}/cafes/${cafe.id}`;
  const images = [cafe.featuredImageUrl, ...cafe.photoUrls].filter(
    (src): src is string => typeof src === "string" && src.length > 0,
  );

  const openingHours = DAY_KEYS.flatMap((day) => {
    const h = hours[day];
    if (!h || h.closed) return [];
    return [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: `https://schema.org/${dayLabel(day)}`,
        opens: h.open,
        closes: h.close,
      },
    ];
  });

  // Cups: only rated cups with a note are Reviews, one per person; the
  // aggregate counts each person once (their latest rated visit). Unrated
  // cups never reach structured data.
  const reviewCards = cups ? jsonLdReviewCards(cups.cards) : [];
  const reviews = cups
    ? reviewCards.map((c) => ({
        "@type": "Review",
        author: { "@type": "Person", name: c.authorName },
        datePublished: c.visitedAt,
        reviewBody: c.note,
        reviewRating: {
          "@type": "Rating",
          ratingValue: c.rating,
          bestRating: 5,
          worstRating: 1,
        },
      }))
    : cafe.reviews
        .filter((r) => r.moderationStatus === "visible" && r.content)
        .slice(0, 5)
        .map((r) => ({
          "@type": "Review",
          author: { "@type": "Person", name: r.authorName },
          datePublished: r.createdAt,
          reviewBody: r.content,
          reviewRating: {
            "@type": "Rating",
            ratingValue: r.rating,
            bestRating: 5,
            worstRating: 1,
          },
        }));

  const aggregate = cups
    ? jsonLdRating(cups, { rating: cafe.rating, reviewCount: cafe.reviewCount })
    : cafe.reviewCount > 0
      ? {
          ratingValue: Number(cafe.rating.toFixed(1)),
          countProperty: "reviewCount" as const,
          count: cafe.reviewCount,
        }
      : null;

  return {
    "@context": "https://schema.org",
    "@type": "CafeOrCoffeeShop",
    "@id": `${url}#cafe`,
    url,
    name: cafe.name,
    ...(cafe.description ? { description: cafe.description } : {}),
    ...(images.length > 0 ? { image: images } : {}),
    ...(cafe.logoUrl ? { logo: cafe.logoUrl } : {}),
    address: {
      "@type": "PostalAddress",
      // The raw address, not the page's display string — that one appends
      // neighborhood and city, which addressLocality already carries.
      streetAddress: cafe.address,
      addressLocality: cafe.city,
      addressCountry: "PH",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: cafe.lat,
      longitude: cafe.lng,
    },
    hasMap: `https://www.google.com/maps/search/?api=1&query=${cafe.lat},${cafe.lng}`,
    ...(openingHours.length > 0
      ? { openingHoursSpecification: openingHours }
      : {}),
    hasMenu: `${url}/menu`,
    // An aggregateRating with no ratings is invalid structured data.
    ...(aggregate
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: aggregate.ratingValue,
            [aggregate.countProperty]: aggregate.count,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    ...(reviews.length > 0 ? { review: reviews } : {}),
  };
}
