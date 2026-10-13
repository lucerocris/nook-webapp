"use client";

import { useEffect } from "react";

import { identify, track, type AnalyticsUser } from "@/lib/analytics";
import { SIGNUP_DONE_COOKIE } from "@/lib/analytics-cookies";

/**
 * Keeps PostHog's idea of who this is in step with the Supabase session the
 * server rendered: identify on sign-in, reset on sign-out. Renders nothing.
 *
 * Also reports `signup_completed`: the server sets a short-lived cookie when
 * a signup is confirmed (code or link), and this — the first render that has
 * the new session — sends the event as that user, then clears the cookie.
 */
export default function AnalyticsIdentity({ user }: { user: AnalyticsUser | null }) {
  const id = user?.id ?? null;
  const email = user?.email ?? null;
  const name = user?.name ?? null;

  useEffect(() => {
    identify(id ? { id, email, name } : null);
    if (!id) return;

    const method = document.cookie
      .split("; ")
      .find((c) => c.startsWith(`${SIGNUP_DONE_COOKIE}=`))
      ?.split("=")[1];
    if (!method) return;
    document.cookie = `${SIGNUP_DONE_COOKIE}=; Max-Age=0; Path=/`;
    track("signup_completed", { method });
  }, [id, email, name]);

  return null;
}
