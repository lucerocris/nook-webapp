import "server-only";

import { cache } from "react";
import { cacheLife } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/env";
import type {
  CommunityCrawlRpc,
  CrawlRunPreviewRpc,
  Database,
} from "@/lib/supabase/types";

/**
 * Community crawls as anyone holding the link sees them
 * (nook-supabase docs/COMMUNITY_CRAWLS.md §5). Read as anon through the two
 * SECURITY DEFINER RPCs only; the tables themselves are closed to anon.
 */

export type CrawlStop = {
  order: number;
  cafeId: string;
  name: string;
  area: string | null;
  imageUrl: string | null;
  lat: number | null;
  lng: number | null;
  /** Straight-line metres to the next stop; null on the last one or when
   * either end has no coordinates. */
  toNextMeters: number | null;
};

export type PublicCrawl = {
  shareCode: string;
  title: string;
  description: string | null;
  creator: { username: string; avatarUrl: string | null } | null;
  stops: CrawlStop[];
  /** Sum of the legs, straight-line, null when no leg could be measured. */
  routeMeters: number | null;
  runsStarted: number;
  completions: number;
};

export type CrewInvite = {
  inviteCode: string;
  shareCode: string;
  title: string;
  stopCount: number;
  plannedFor: string | null;
  crewSize: number;
  crewLimit: number;
  starter: { username: string; avatarUrl: string | null } | null;
};

/** Share codes are 8 characters (hex today); invite codes 10. The server
 * upper-cases and trims, so this only screens out obvious junk before a
 * round trip. */
const SHARE_CODE_RE = /^[0-9A-Za-z]{6,12}$/;
const INVITE_CODE_RE = /^[0-9A-Za-z]{6,16}$/;

export function normalizeShareCode(raw: string): string | null {
  const code = decodeURIComponent(raw).trim();
  return SHARE_CODE_RE.test(code) ? code.toUpperCase() : null;
}

export function normalizeInviteCode(raw: string | null | undefined): string | null {
  const code = raw?.trim() ?? "";
  return INVITE_CODE_RE.test(code) ? code.toUpperCase() : null;
}

function createAnonClient() {
  return createSupabaseClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function text(value: string | null | undefined): string | null {
  const t = value?.trim();
  return t ? t : null;
}

/** Great-circle distance in metres. */
function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6_371_000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function hasPoint(s: { lat: number | null; lng: number | null }): s is { lat: number; lng: number } {
  return typeof s.lat === "number" && typeof s.lng === "number";
}

export function mapCrawl(row: CommunityCrawlRpc): PublicCrawl {
  const ordered = [...(row.stops ?? [])].sort((a, b) => a.stop_order - b.stop_order);
  const stops: CrawlStop[] = ordered.map((s, i) => {
    const next = ordered[i + 1];
    return {
      order: i + 1,
      cafeId: s.cafe_id,
      name: s.name.trim(),
      area: text(s.neighborhood),
      imageUrl: text(s.featured_image_url),
      lat: s.lat,
      lng: s.lng,
      toNextMeters: next && hasPoint(s) && hasPoint(next) ? haversine(s, next) : null,
    };
  });
  const legs = stops.map((s) => s.toNextMeters).filter((m): m is number => m !== null);
  const username = text(row.creator?.username);
  return {
    shareCode: row.share_code,
    title: row.title.trim(),
    description: text(row.description),
    creator: username ? { username, avatarUrl: text(row.creator?.avatar_url) } : null,
    stops,
    routeMeters: legs.length > 0 ? legs.reduce((a, b) => a + b, 0) : null,
    runsStarted: row.runs_started ?? 0,
    completions: row.completions ?? 0,
  };
}

function mapInvite(inviteCode: string, row: CrawlRunPreviewRpc): CrewInvite {
  const username = text(row.starter_username);
  return {
    inviteCode,
    shareCode: row.share_code,
    title: row.title.trim(),
    stopCount: row.stop_count,
    plannedFor: row.planned_for,
    crewSize: row.crew_size,
    crewLimit: row.crew_limit,
    starter: username ? { username, avatarUrl: text(row.starter_avatar_url) } : null,
  };
}

/** PostgREST's "no such function": the migration is not applied here. */
const MISSING_FUNCTION = "PGRST202";

/**
 * A crawl by its share code, or null for unknown, private, archived and
 * removed alike: anon gets only `link` + `active` crawls. Cached for minutes
 * so a crawl taken private or removed drops off soon.
 */
export const getPublicCrawl = cache(async (rawCode: string): Promise<PublicCrawl | null> => {
  "use cache";
  cacheLife("minutes");

  const code = normalizeShareCode(rawCode);
  if (!code) return null;

  const { data, error } = await createAnonClient().rpc("get_community_crawl", {
    p_share_code: code,
  });
  if (error) {
    if (error.code === MISSING_FUNCTION) return null;
    throw error;
  }
  return data ? mapCrawl(data as CommunityCrawlRpc) : null;
});

/**
 * A crew invite, or null when the invite is unknown, its crawl was removed,
 * or it belongs to a different crawl than the link's code (a hand-edited
 * link). An invite works for a private or archived crawl too: holding it is
 * the permission, and the preview carries only the title, stop count, crew
 * size and starter.
 */
export const getCrewInvite = cache(
  async (rawShareCode: string, rawInvite: string): Promise<CrewInvite | null> => {
    "use cache";
    cacheLife("minutes");

    const shareCode = normalizeShareCode(rawShareCode);
    const invite = normalizeInviteCode(rawInvite);
    if (!shareCode || !invite) return null;

    const { data, error } = await createAnonClient().rpc("get_community_crawl_run_preview", {
      p_invite_code: invite,
    });
    if (error) {
      if (error.code === MISSING_FUNCTION) return null;
      throw error;
    }
    if (!data) return null;
    const preview = mapInvite(invite, data as CrawlRunPreviewRpc);
    return preview.shareCode.toUpperCase() === shareCode ? preview : null;
  },
);
