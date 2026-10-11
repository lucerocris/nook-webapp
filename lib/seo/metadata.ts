import type { Metadata } from "next";

export const SITE_TITLE = "Nook — Philippine cafes, community curated";
export const SITE_DESCRIPTION =
  "Find the perfect spot to work, study, or chill. Filter cafes by Wi-Fi, outlets, and vibe.";

/** Next merges metadata shallowly: a page that sets `openGraph` replaces the
 * layout's whole object rather than adding to it. Pages that need their own
 * `url` spread this so they keep the site name, type and copy. */
export const BASE_OPEN_GRAPH = {
  type: "website",
  siteName: "Nook",
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
} satisfies Metadata["openGraph"];

/** Share tags for a page under a cafe (its cups, what it offers): the page's
 * own title and copy with the cafe's photo, instead of the layout's site-wide
 * defaults. */
export function cafeShareMetadata({
  title,
  description,
  path,
  cafe,
}: {
  title: string;
  description: string;
  path: string;
  cafe: { name: string; featuredImageUrl: string | null };
}): Pick<Metadata, "openGraph" | "twitter"> {
  const images = cafe.featuredImageUrl
    ? [{ url: cafe.featuredImageUrl, alt: cafe.name }]
    : undefined;
  return {
    openGraph: { ...BASE_OPEN_GRAPH, title, description, url: path, images },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title,
      description,
      images,
    },
  };
}
