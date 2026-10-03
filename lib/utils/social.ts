export type SocialKind = "instagram" | "facebook" | "tiktok" | "website";

export type SocialLink = { kind: SocialKind; label: string; url: string };

const ORDER: { kind: SocialKind; label: string }[] = [
  { kind: "instagram", label: "Instagram" },
  { kind: "facebook", label: "Facebook" },
  { kind: "tiktok", label: "TikTok" },
  { kind: "website", label: "Website" },
];

/** `cafes.social_links` is `{ instagram, facebook, tiktok, website }` with
 * empty strings for missing ones, and owners sometimes leave off the scheme
 * ("www.tiktok.com/@…"). Returns only the usable links, as absolute URLs. */
export function parseSocialLinks(value: unknown): SocialLink[] {
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  const links: SocialLink[] = [];
  for (const { kind, label } of ORDER) {
    const raw = record[kind];
    if (typeof raw !== "string") continue;
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const url = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    try {
      new URL(url);
    } catch {
      continue;
    }
    links.push({ kind, label, url });
  }
  return links;
}
