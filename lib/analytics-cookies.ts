/**
 * Set by the server when a signup is confirmed, read once by
 * AnalyticsIdentity to send `signup_completed` as the new user. Its value is
 * how the signup was confirmed: "otp" (typed the code) or "link".
 */
export const SIGNUP_DONE_COOKIE = "nook_signup_done";

export const SIGNUP_DONE_COOKIE_OPTIONS = {
  path: "/",
  maxAge: 600,
  sameSite: "lax" as const,
  // Read by client JS, so not httpOnly. It carries no identity, only "otp" or "link".
  httpOnly: false,
  secure: process.env.NODE_ENV === "production",
};
