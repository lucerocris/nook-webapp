"use client";

import { useEffect } from "react";

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = "https://us.i.posthog.com";

/**
 * One anonymous `cup_page_viewed` hit when a shared cup link carries a
 * `?ref=` (SHARE_CUP_STORY §6.5): no cookie, no person profile, a random id
 * for this tab only. Does nothing unless NEXT_PUBLIC_POSTHOG_KEY is set for
 * the deployment.
 */
export default function CupPageBeacon({ cupId, cafeId }: { cupId: string; cafeId: string }) {
  useEffect(() => {
    if (!KEY) return;
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (!ref) return;
    const body = JSON.stringify({
      api_key: KEY,
      event: "cup_page_viewed",
      distinct_id: crypto.randomUUID(),
      properties: {
        ref: ref.slice(0, 40),
        cup_id: cupId,
        cafe_id: cafeId,
        $current_url: window.location.href,
        $process_person_profile: false,
      },
    });
    fetch(`${HOST}/i/v0/e/`, {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body,
    }).catch(() => {});
  }, [cupId, cafeId]);
  return null;
}
