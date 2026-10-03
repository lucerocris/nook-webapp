/**
 * Resolved from the App Store rather than typed from memory: the iOS bundle id
 * in `nook-mobile` (`app.nookph`) looked up against Apple's public catalogue
 * returns exactly one record, track 6782604940. It is a Philippines-storefront
 * release, which is why the link is /ph/.
 */
export const APP_STORE_URL =
  "https://apps.apple.com/ph/app/nook-cafe-finder/id6782604940";

/** Same `app.nookph` id as iOS; the Play listing went live by 2026-10-03. */
export const PLAY_STORE_URL: string | null =
  "https://play.google.com/store/apps/details?id=app.nookph";

export const BUSINESS_URL = "https://business.nookph.app/";
export const PRIVACY_URL = "https://privacy.nookph.app/";
