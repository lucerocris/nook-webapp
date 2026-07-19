import type { NextConfig } from "next";

// Every pattern is an exact host. A wildcard here turns /_next/image into an
// open image proxy — anyone can create a bucket on the wildcarded domain and
// serve arbitrary bytes from our origin, billed to us per transformation.
// These two are the only hosts any image URL in the database resolves to
// (verified across cafes, menu_items, cafe_images, reviews, profiles, lists);
// `images.unsplash.com`, `*.supabase.co` and `*.digitaloceanspaces.com` were
// all unreferenced. Add new hosts explicitly as storage moves.
const remotePatterns = [
  {
    protocol: "https" as const,
    hostname: "lucerocris.sgp1.cdn.digitaloceanspaces.com",
  },
  {
    protocol: "https" as const,
    hostname: "lucerocris.sgp1.digitaloceanspaces.com",
  },
];

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    // Geolocation stays on — the nearby-cafes opt-in needs it.
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), payment=(), geolocation=(self)",
  },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    remotePatterns,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // 85 KB of static map style, refetched on every map mount because
        // /public defaults to must-revalidate. This tells browsers to hold it
        // for a year, so content-hash the filename if the style ever changes.
        source: "/mapstyle.json",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
