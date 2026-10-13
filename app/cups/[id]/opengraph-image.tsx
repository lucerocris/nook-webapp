import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

import { getCupPublic } from "@/lib/data/cups";
import { cupLead, cupPhotoEntries } from "@/lib/data/cups-mappers";

export const alt = "A cup on Nook: what they had, the cafe and the stars";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#101514";
const MUTED = "#5C605D";
const PAPER = "#F7F6F2";
const BRAND = "#3A5A40";
const LINE = "#D4D4D0";
const KIND: Record<string, string> = { coffee: "Coffee", drink: "Drink", food: "Food", space: "Space" };

/** Short-lived on purpose: a cup hidden by moderation must stop unfurling
 * within minutes (SHARE_CUP_STORY §6.4). */
const headers = { "Cache-Control": "public, max-age=300, s-maxage=300" };

async function inline(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const type = res.headers.get("content-type")?.split(";")[0] ?? "";
    if (type !== "image/jpeg" && type !== "image/png") return null;
    const bytes = Buffer.from(await res.arrayBuffer());
    return `data:${type};base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}

function clip(text: string, max: number): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat;
}

function Stars({ rating }: { rating: number }) {
  const filled = Math.round(rating);
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width={34} height={34} viewBox="0 0 24 24">
          <path
            d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z"
            fill={i < filled ? INK : LINE}
          />
        </svg>
      ))}
    </div>
  );
}

/**
 * The link preview for /cups/<id>: the cup's photo on the left, what it was,
 * the cafe, its area and the stars on the right, the wordmark under them. A
 * cup without a photo gets a green panel with its note instead. A cup that
 * isn't public gets the wordmark alone, so a moderated photo never leaks
 * through a cached preview.
 */
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [pub, semibold, regular, logo] = await Promise.all([
    getCupPublic(id).catch(() => null),
    readFile(join(process.cwd(), "lib/og/fonts/Poppins-SemiBold.ttf")),
    readFile(join(process.cwd(), "lib/og/fonts/Poppins-Regular.ttf")),
    readFile(join(process.cwd(), "public/logo.svg")),
  ]);
  const logoSrc = `data:image/svg+xml;base64,${logo.toString("base64")}`;
  const fonts = [
    { name: "Poppins", data: semibold, weight: 600 as const, style: "normal" as const },
    { name: "Poppins", data: regular, weight: 400 as const, style: "normal" as const },
  ];

  if (!pub) {
    return new ImageResponse(
      (
        <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", background: "white" }}>
          <img src={logoSrc} width={297} height={100} alt="Nook" />
        </div>
      ),
      { ...size, fonts, headers },
    );
  }

  const { cup, cafe } = pub;
  const first = cupPhotoEntries(cup)[0] ?? null;
  const photo = await inline(first?.imageUrl ?? null);
  const lead = cupLead(cup);
  const leadKind = lead ? cup.items.find((i) => i.label === lead)?.kind : null;
  const headline = lead ? clip(lead, 44) : "A cup";

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: "white", fontFamily: "Poppins", color: INK }}>
        {photo ? (
          <img src={photo} width={504} height={630} alt="" style={{ objectFit: "cover", background: PAPER }} />
        ) : (
          <div
            style={{
              display: "flex",
              width: 504,
              height: 630,
              background: BRAND,
              color: "white",
              padding: 56,
              alignItems: "center",
              fontSize: 36,
              lineHeight: 1.35,
            }}
          >
            {cup.note ? `“${clip(cup.note, 150)}”` : clip(cafe.name, 40)}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, padding: "64px 64px 56px" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: headline.length > 24 ? 46 : 56, fontWeight: 600, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
              {headline}
            </div>
            {leadKind ? (
              <div style={{ display: "flex", marginTop: 10, fontSize: 26, color: MUTED }}>{KIND[leadKind]}</div>
            ) : null}
            <div style={{ display: "flex", marginTop: 36, fontSize: 34, fontWeight: 600 }}>{clip(cafe.name, 34)}</div>
            {cafe.area ? (
              <div style={{ display: "flex", marginTop: 4, fontSize: 26, color: MUTED }}>{clip(cafe.area, 40)}</div>
            ) : null}
            {cup.rating !== null ? (
              <div style={{ display: "flex", marginTop: 28 }}>
                <Stars rating={cup.rating} />
              </div>
            ) : null}
          </div>
          <img src={logoSrc} width={131} height={44} alt="Nook" />
        </div>
      </div>
    ),
    { ...size, fonts, headers },
  );
}
