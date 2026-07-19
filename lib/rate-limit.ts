import "server-only";

/**
 * Best-effort in-memory rate limiter.
 *
 * Deliberately dependency-free so it can ship today. Its limits are real but
 * PER SERVERLESS INSTANCE — a distributed attacker hitting many cold instances
 * can exceed the nominal cap, and counters reset on redeploy. It is a speed
 * bump, not a guarantee.
 *
 * For a hard ceiling on paid APIs, back this with Upstash Redis (or a Postgres
 * counter) AND set a spend limit in the provider's billing console. The billing
 * cap is the only control that cannot be bypassed by scaling.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Prevents unbounded growth from unique keys (e.g. spoofed IPs). */
const MAX_TRACKED_KEYS = 10_000;

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();

  if (buckets.size > MAX_TRACKED_KEYS) {
    for (const [k, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(k);
    }
    // Still oversized after pruning expired entries: drop everything rather
    // than leak memory. Worst case is one forgiving window.
    if (buckets.size > MAX_TRACKED_KEYS) buckets.clear();
  }

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  if (existing.count > limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  return {
    ok: true,
    remaining: limit - existing.count,
    retryAfterSeconds: 0,
  };
}

/** Best available client identifier behind Vercel's proxy. */
export function clientKey(request: Request, prefix: string): string {
  return headerKey(request.headers, prefix);
}

/** Same, for callers that hold Headers rather than a Request — Server Actions
 * get theirs from `headers()` in next/headers and never see a Request. */
export function headerKey(headers: Headers, prefix: string): string {
  const forwarded = headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown";
  return `${prefix}:${ip}`;
}
