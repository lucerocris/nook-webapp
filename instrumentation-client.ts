import { APP, attach, rememberSrc, track } from "@/lib/analytics";

const token = process.env.NEXT_PUBLIC_POSTHOG_KEY;
/** Our own path, rewritten to PostHog in next.config.ts so ad blockers that
 * block *.posthog.com don't drop the events. */
const PROXY_PATH = "/nk";
const UI_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST?.includes("eu.")
  ? "https://eu.posthog.com"
  : "https://us.posthog.com";

/**
 * A build on your own machine is testing, not usage; it never reports — unless
 * NEXT_PUBLIC_POSTHOG_FORCE=true, the web twin of nook-mobile's
 * NOOK_FORCE_ANALYTICS. Forced runs report under a `dev-test-` distinct id so
 * they can be found and ignored.
 */
const local = /^(localhost|127\.|\[::1\]$|0\.0\.0\.0$)/.test(window.location.hostname);
const forced = process.env.NEXT_PUBLIC_POSTHOG_FORCE === "true";

if (token && (!local || forced)) {
  // Imported here rather than at the top so the SDK is its own chunk, fetched
  // after the page instead of added to every page's first load.
  void import("posthog-js").then(({ default: posthog }) => {
    posthog.init(token, {
      api_host: PROXY_PATH,
      ui_host: UI_HOST,
      defaults: "2026-05-30",
      // App Router navigations are history changes; this covers them.
      capture_pageview: "history_change",
      capture_pageleave: true,
      person_profiles: "identified_only",
      // Recording is on for the project; every input is masked here, so what
      // anyone types (search, email, password, codes) never leaves the page.
      session_recording: {
        maskAllInputs: true,
        maskInputOptions: { password: true, email: true },
      },
      ...(local && forced ? { bootstrap: { distinctID: devTestId() } } : {}),
      // Stamped on every event, pageviews included, so the web's data can be
      // told apart from the mobile app's and study-hub's: app = nook-webapp.
      before_send: (event) => {
        if (!event) return event;
        // A ?src= on this address (a shared link, a QR) is registered before
        // the event leaves, so the event that landed on it carries it too.
        const src = rememberSrc(posthog);
        event.properties = {
          ...event.properties,
          ...(src ? { src, initial_src: event.properties.initial_src ?? src } : {}),
          app: APP,
          app_env: local ? "development" : process.env.NODE_ENV,
        };
        return event;
      },
    });
    attach(posthog);
  });
}

/** One `dev-test-…` id per browser, kept across reloads: bootstrap would
 * otherwise replace the stored id with a fresh one on every page load. */
function devTestId(): string {
  const KEY = "nook_dev_test_id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = `dev-test-${crypto.randomUUID()}`;
    localStorage.setItem(KEY, id);
  }
  return id;
}

/**
 * "Get the app" clicks, wherever they sit. The store badges are server
 * components, so instead of turning each into a client component they carry
 * `data-get-app="ios|android|any"` and `data-get-app-placement="…"`, and one
 * listener here reports them.
 */
document.addEventListener(
  "click",
  (e) => {
    const target = e.target instanceof Element ? e.target.closest<HTMLElement>("[data-get-app]") : null;
    if (!target) return;
    track("get_app_clicked", {
      platform: target.dataset.getApp,
      placement: target.dataset.getAppPlacement ?? "unknown",
    });
  },
  { capture: true },
);
