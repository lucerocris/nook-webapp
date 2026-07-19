import type { MetadataRoute } from "next";

import { getSitemapCafes } from "@/lib/data/cafes";
import { SITE_URL as siteUrl } from "@/lib/env";

/** Cafe detail pages are the commercially important URLs; without a sitemap
 * they have no crawl path beyond incidental internal links. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/map`, changeFrequency: "daily", priority: 0.8 },
  ];

  let cafeRoutes: MetadataRoute.Sitemap = [];
  try {
    const cafes = await getSitemapCafes();
    cafeRoutes = cafes.map((cafe) => ({
      url: `${siteUrl}/cafes/${cafe.id}`,
      lastModified: cafe.lastModified ? new Date(cafe.lastModified) : undefined,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch (error) {
    // A sitemap that 500s is worse than a partial one — serve the static routes.
    console.error("[sitemap] failed to load cafes", error);
  }

  return [...staticRoutes, ...cafeRoutes];
}
