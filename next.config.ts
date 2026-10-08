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

// Crawlers that get blocking metadata: <title>, description, canonical and OG
// tags in the initial <head> instead of streamed in after the page shell.
// Next's default list (social previews, Bing, Yandex, …) deliberately leaves
// out Googlebot — it renders JS, so it gets streamed metadata — and has no AI
// crawlers at all. Every cafe page streams its body behind Suspense, so for
// those bots the first HTML had no title or canonical. Overriding the option
// replaces the default list, so the default entries are repeated here.
const htmlLimitedBots = new RegExp(
  [
    // Next's defaults (next/dist/shared/lib/router/utils/html-bots).
    "[\\w-]+-Google",
    "Google-[\\w-]+",
    "Chrome-Lighthouse",
    "Slurp",
    "DuckDuckBot",
    "baiduspider",
    "yandex",
    "sogou",
    "bitlybot",
    "tumblr",
    "vkShare",
    "quora link preview",
    "redditbot",
    "ia_archiver",
    "Bingbot",
    "BingPreview",
    "applebot",
    "facebookexternalhit",
    "facebookcatalog",
    "Twitterbot",
    "LinkedInBot",
    "Slackbot",
    "Discordbot",
    "WhatsApp",
    "SkypeUriPreview",
    "Yeti",
    "googleweblight",
    // Added: Google's main crawler, and AI search/answer crawlers.
    "Googlebot",
    "GPTBot",
    "OAI-SearchBot",
    "ChatGPT-User",
    "ClaudeBot",
    "Claude-User",
    "Claude-SearchBot",
    "PerplexityBot",
    "Perplexity-User",
    "CCBot",
    "Amazonbot",
    "Bytespider",
    "meta-externalagent",
    "MistralAI-User",
    "cohere-ai",
  ].join("|"),
  "i",
);

const nextConfig: NextConfig = {
  cacheComponents: true,
  htmlLimitedBots,
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
        // Universal links: iOS fetches this file without an extension and
        // needs it served as JSON.
        source: "/.well-known/apple-app-site-association",
        headers: [{ key: "Content-Type", value: "application/json" }],
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
