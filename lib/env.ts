/**
 * Validated environment access.
 *
 * Every Supabase client used to read `process.env.NEXT_PUBLIC_…!`. The
 * non-null assertion is a lie the type system can't check: if the var is
 * missing or misspelled in Vercel's project settings the build still succeeds
 * (Next inlines the value as `undefined`), and every request then fails at
 * runtime with `supabaseUrl is required` — no hint that the cause is config.
 * Because `proxy.ts` matches almost every route, that is total site failure
 * from a typo.
 *
 * Reading through here instead turns that into one loud, named error at module
 * load, naming the variable. NEXT_PUBLIC_* must be referenced as a literal
 * property so the bundler can inline it for the browser — hence no dynamic
 * `process.env[name]` lookups.
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. ` +
        `Set it in .env.local for development, or in the Vercel project ` +
        `settings for deployed environments. See .env.example.`,
    );
  }
  return value;
}

export const SUPABASE_URL = required(
  "NEXT_PUBLIC_SUPABASE_URL",
  process.env.NEXT_PUBLIC_SUPABASE_URL,
);

export const SUPABASE_PUBLISHABLE_KEY = required(
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

/** Absolute base for canonical/OG URLs. Optional: without it every canonical,
 * OG image, robots.txt sitemap pointer and sitemap entry silently points at
 * the fallback host, which is an SEO outage that is hard to notice. Set it
 * explicitly in production. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://nookph.app";
