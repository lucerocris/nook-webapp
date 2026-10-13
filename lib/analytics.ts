import type { PostHog } from "posthog-js";

/**
 * Product analytics, sent to PostHog project "Nook" (473868).
 *
 * The project is shared with the mobile app and with study-hub, so every
 * event this site sends is stamped `app: "nook-webapp"` before it leaves (see
 * instrumentation-client.ts). Filter every web chart on that property.
 *
 * Signed-in visitors are identified by their Supabase user id, the same
 * distinct id nook-mobile uses, so one person's web and app activity merge.
 *
 * The SDK loads after the page, not with it. Events fired before it arrives
 * wait in a short queue and go out with the time they happened.
 */
export const APP = "nook-webapp";

export type AnalyticsEvent =
  | "cafe_page_viewed"
  | "get_app_clicked"
  | "share_link_opened"
  | "cup_page_viewed"
  | "signup_started"
  | "signup_completed"
  | "search_performed"
  | "map_cafe_opened";

/** Where a get-the-app button sits. Each value is one placement on the site. */
export type GetAppPlacement =
  | "footer"
  | "app_band"
  | "download_page"
  | "cup_page"
  | "profile_band"
  | "profile_header"
  | "crawl_header";

/** `any` is the download page: a desktop visitor, both badges and a QR. */
export type GetAppPlatform = "ios" | "android" | "any";

export type AnalyticsUser = {
  id: string;
  email: string | null;
  name: string | null;
};

type Pending =
  | { kind: "capture"; event: AnalyticsEvent; properties?: Record<string, unknown>; at: Date }
  | { kind: "identify"; user: AnalyticsUser | null };

let client: PostHog | null = null;
const pending: Pending[] = [];
/** Enough for a page's worth of events; past it PostHog is not coming. */
const MAX_PENDING = 50;

/** First-touch `?src=`, kept by the SDK as a super property once registered. */
const INITIAL_SRC = "initial_src";
/** The id the last identify() ran for, so a re-render doesn't repeat it. */
let identifiedAs: string | null | undefined;

/** Called once the SDK has loaded and been initialised. */
export function attach(posthog: PostHog) {
  client = posthog;
  for (const p of pending.splice(0)) {
    if (p.kind === "capture") posthog.capture(p.event, p.properties, { timestamp: p.at });
    else applyIdentity(posthog, p.user);
  }
}

/** A no-op on the server, and whenever PostHog is not configured. */
export function track(event: AnalyticsEvent, properties?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (client) client.capture(event, properties);
  else if (pending.length < MAX_PENDING) pending.push({ kind: "capture", event, properties, at: new Date() });
}

/**
 * Ties this browser to the signed-in Supabase user, or unties it on sign-out.
 * Mirrors nook-mobile's `_identifyPosthogUser`: distinct id is the Supabase
 * user id, email and name are person properties, never the id.
 */
export function identify(user: AnalyticsUser | null) {
  if (typeof window === "undefined") return;
  if (client) applyIdentity(client, user);
  else if (pending.length < MAX_PENDING) pending.push({ kind: "identify", user });
}

function applyIdentity(posthog: PostHog, user: AnalyticsUser | null) {
  const id = user?.id ?? null;
  if (identifiedAs === id) return;
  identifiedAs = id;

  if (!user) {
    // Signed out (or never signed in). Only reset a browser that was tied to
    // someone; resetting an anonymous one would mint a new visitor per page.
    if (posthog.get_property("$user_state") === "identified") posthog.reset();
    return;
  }
  if (posthog.get_distinct_id() === user.id) return;

  const props: Record<string, string> = {};
  if (user.email) props.email = user.email;
  if (user.name) props.name = user.name;
  const initialSrc = posthog.get_property(INITIAL_SRC);
  posthog.identify(
    user.id,
    props,
    typeof initialSrc === "string" ? { [INITIAL_SRC]: initialSrc } : undefined,
  );
}

/** The `?src=` on the current address, trimmed to something sane. */
export function currentSrc(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const src = new URLSearchParams(window.location.search).get("src")?.trim();
  return src ? src.slice(0, 64) : undefined;
}

/**
 * Registers the address's `?src=` as `src` for this session and as
 * `initial_src` for good (first touch wins). Runs for every event, so it only
 * writes when the value changes. Returns the src on this address, if any.
 */
export function rememberSrc(posthog: PostHog): string | undefined {
  const src = currentSrc();
  if (!src) return undefined;
  if (posthog.getSessionProperty("src") !== src) posthog.register_for_session({ src });
  if (posthog.get_property(INITIAL_SRC) === undefined) posthog.register_once({ [INITIAL_SRC]: src });
  return src;
}
