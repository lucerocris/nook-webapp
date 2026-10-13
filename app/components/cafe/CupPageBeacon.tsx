"use client";

import { useEffect } from "react";

import { track } from "@/lib/analytics";

/**
 * One `cup_page_viewed` when a shared cup link carries a `?ref=`
 * (SHARE_CUP_STORY §6.5). Goes through the site's PostHog client, so it is
 * stamped app=nook-webapp like everything else and creates no person profile
 * for an anonymous visitor.
 */
export default function CupPageBeacon({ cupId, cafeId }: { cupId: string; cafeId: string }) {
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (!ref) return;
    track("cup_page_viewed", { ref: ref.slice(0, 40), cup_id: cupId, cafe_id: cafeId });
  }, [cupId, cafeId]);
  return null;
}
