"use client";

import { useEffect } from "react";

import { currentSrc, track, type AnalyticsEvent } from "@/lib/analytics";

/** The last view sent, so a remount of the same page (dev Strict Mode, a
 * Suspense boundary re-showing) doesn't count it twice. */
let last: { id: string; at: number } | null = null;
const REMOUNT_WINDOW_MS = 2000;

/**
 * Sends one event when the page it sits on is shown. Lets a server-rendered
 * page report a view without becoming a client component. The address's
 * `?src=` rides along as `src`.
 */
export default function TrackView({
  event,
  properties,
}: {
  event: AnalyticsEvent;
  properties: Record<string, string | number | boolean | null>;
}) {
  // Keyed on the serialised properties so a same-component navigation to
  // another cafe reports again, but a re-render does not.
  const key = JSON.stringify(properties);
  useEffect(() => {
    const id = `${event}|${key}|${window.location.href}`;
    const now = Date.now();
    if (last && last.id === id && now - last.at < REMOUNT_WINDOW_MS) return;
    last = { id, at: now };
    const src = currentSrc();
    track(event, { ...JSON.parse(key), ...(src ? { src } : {}) });
  }, [event, key]);
  return null;
}
