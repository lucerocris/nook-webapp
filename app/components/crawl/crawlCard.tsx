/* eslint-disable @next/next/no-img-element -- Satori draws plain <img>, not next/image. */
import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";

import type { CrewInvite, PublicCrawl } from "@/lib/data/crawls";
import { formatDistance } from "@/lib/utils/format";

export const CARD_SIZE = { width: 1200, height: 630 };

const INK = "#101514";
const MUTED = "#5C605D";
const PAPER = "#F7F6F2";
const BRAND = "#3A5A40";
const LINE = "#D4D4D0";

/**
 * A remote photo as a JPEG data URL, or null. Cafe photos are mostly WebP,
 * which Satori cannot draw, so each is re-encoded (and cropped to the tile)
 * with sharp. One slow or broken photo must not sink the whole preview.
 */
async function tile(url: string | null, w: number, h: number): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const input = Buffer.from(await res.arrayBuffer());
    const out = await sharp(input).resize(w * 2, h * 2, { fit: "cover" }).jpeg({ quality: 78 }).toBuffer();
    return `data:image/jpeg;base64,${out.toString("base64")}`;
  } catch {
    return null;
  }
}

function clip(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/**
 * The link preview for a shared crawl: the invite on the left (chip, who
 * invited you, the title, stops and distance, the wordmark) and the stops'
 * photos on the right, numbered in visiting order like the page. With only a
 * crew invite readable there are no photos: the left side alone, centred.
 */
export async function renderCrawlCard(
  crawl: PublicCrawl | null,
  invite: CrewInvite | null,
): Promise<ImageResponse> {
  const [semibold, regular, logo] = await Promise.all([
    readFile(join(process.cwd(), "lib/og/fonts/Poppins-SemiBold.ttf")),
    readFile(join(process.cwd(), "lib/og/fonts/Poppins-Regular.ttf")),
    readFile(join(process.cwd(), "public/logo.svg")),
  ]);
  const logoSrc = `data:image/svg+xml;base64,${logo.toString("base64")}`;
  const fonts = [
    { name: "Poppins", data: semibold, weight: 600 as const, style: "normal" as const },
    { name: "Poppins", data: regular, weight: 400 as const, style: "normal" as const },
  ];

  if (!crawl && !invite) {
    return new ImageResponse(
      (
        <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", background: "white" }}>
          <img src={logoSrc} width={297} height={100} alt="Nook" />
        </div>
      ),
      { ...CARD_SIZE, fonts },
    );
  }

  const stops = crawl?.stops ?? [];
  const many = stops.length > 3;
  const size = many ? { w: 168, h: 210 } : { w: 190, h: 250 };
  const shown = stops.slice(0, 6);
  const photos = await Promise.all(shown.map((s) => tile(s.imageUrl, size.w, size.h)));

  const title = crawl?.title ?? invite?.title ?? "";
  const count = crawl ? stops.length : (invite?.stopCount ?? 0);
  const facts = [
    `${count} ${count === 1 ? "stop" : "stops"}`,
    crawl?.routeMeters ? `${formatDistance(crawl.routeMeters)} stop to stop` : null,
    invite ? `${invite.crewSize} of ${invite.crewLimit} in the crew` : null,
  ]
    .filter(Boolean)
    .join("  ·  ");
  const byline = invite
    ? invite.starter
      ? `@${invite.starter.username} invited you to their crew`
      : "You're invited to a crew"
    : crawl?.creator
      ? `A crawl by @${crawl.creator.username}`
      : null;
  const centred = shown.length === 0;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "white",
          fontFamily: "Poppins",
          color: INK,
          padding: 64,
          alignItems: "center",
          justifyContent: centred ? "center" : "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: centred ? "center" : "flex-start",
            width: centred ? 900 : 470,
            height: "100%",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: centred ? "center" : "flex-start" }}>
            <div
              style={{
                display: "flex",
                border: `2px solid ${LINE}`,
                borderRadius: 999,
                padding: "6px 20px",
                fontSize: 24,
                color: MUTED,
              }}
            >
              {invite ? "Crew invite" : "Cafe crawl"}
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 28,
                fontSize: title.length > 26 ? 48 : 60,
                fontWeight: 600,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                textAlign: centred ? "center" : "left",
              }}
            >
              {clip(title, 60)}
            </div>
            {byline ? (
              <div style={{ display: "flex", marginTop: 14, fontSize: 28, color: MUTED }}>{clip(byline, 44)}</div>
            ) : null}
            <div style={{ display: "flex", marginTop: 22, fontSize: 26, color: INK }}>{facts}</div>
          </div>
          <img src={logoSrc} width={131} height={44} alt="Nook" />
        </div>

        {shown.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", width: size.w * 3 + 24, gap: 12, justifyContent: "flex-end" }}>
            {shown.map((s, i) => (
              <div key={i} style={{ display: "flex", position: "relative", width: size.w, height: size.h }}>
                {photos[i] ? (
                  <img
                    src={photos[i] as string}
                    width={size.w}
                    height={size.h}
                    alt=""
                    style={{ objectFit: "cover", borderRadius: 18 }}
                  />
                ) : (
                  <div
                    style={{
                      display: "flex",
                      width: size.w,
                      height: size.h,
                      borderRadius: 18,
                      background: PAPER,
                      alignItems: "flex-end",
                      padding: 14,
                      fontSize: 20,
                      fontWeight: 600,
                    }}
                  >
                    {clip(s.name, 28)}
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    position: "absolute",
                    top: 10,
                    left: 10,
                    width: 40,
                    height: 40,
                    borderRadius: 999,
                    background: BRAND,
                    border: "3px solid white",
                    color: "white",
                    fontSize: 20,
                    fontWeight: 600,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {String(s.order)}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    ),
    { ...CARD_SIZE, fonts },
  );
}
