import type { MetadataRoute } from "next";

import { getSitemapCafes } from "@/lib/data/cafes";
import { SITE_URL as siteUrl } from "@/lib/env";

/** Cafe detail pages are the commercially important URLs; without a sitemap
 * they have no crawl path beyond incidental internal links. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/map`, changeFrequency: "daily", priority: 0.8 },
    // The only route pointing at the iOS listing, so it needs a crawl path of
    // its own — nothing links to it but the footer and the account menu.
    {
      url: `${siteUrl}/download-app`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  let cafeRoutes: MetadataRoute.Sitemap = [];
  try {
    const cafes = await getSitemapCafes();
    cafeRoutes = cafes.flatMap((cafe) => {
      const lastModified = cafe.lastModified ? new Date(cafe.lastModified) : undefined;
      return [
        {
          url: `${siteUrl}/cafes/${cafe.id}`,
          lastModified,
          changeFrequency: "weekly" as const,
          priority: 0.7,
        },
        // Each cafe's cups (visits, filterable) and its full tag list are
        // pages of their own, linked only from the cafe page.
        {
          url: `${siteUrl}/cafes/${cafe.id}/cups`,
          changeFrequency: "weekly" as const,
          priority: 0.5,
        },
        {
          url: `${siteUrl}/cafes/${cafe.id}/offers`,
          lastModified,
          changeFrequency: "monthly" as const,
          priority: 0.4,
        },
      ];
    });
  } catch (error) {
    // A sitemap that 500s is worse than a partial one — serve the static routes.
    console.error("[sitemap] failed to load cafes", error);
  }

  return [...staticRoutes, ...cafeRoutes];
}
