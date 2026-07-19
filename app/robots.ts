import type { MetadataRoute } from "next";

import { siteUrl } from "./layout";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Auth pages and the JSON endpoints carry no indexable content.
      disallow: ["/api/", "/login", "/signup"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
