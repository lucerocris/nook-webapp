import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

import { getPublicProfile } from "@/lib/data/profiles";

export const alt = "Profile on Nook: name, counts and coffee photos";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#101514";
const MUTED = "#5C605D";
const PAPER = "#F7F6F2";
const TIMBERWOLF = "#DAD7CD";

/** A remote image as a data URL, or null. Satori draws JPEG and PNG only,
 * and one slow or broken photo must not sink the whole preview. */
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
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/**
 * The link preview for /u/<username>: who it is on the left (avatar, name,
 * handle, counts, the wordmark) and up to six of their gallery photos on the
 * right. Nothing about their ranking. A profile with its gallery off, or no
 * photos yet, gets the left side alone, centred.
 */
export default async function Image({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const [profile, semibold, regular, logo] = await Promise.all([
    getPublicProfile(username),
    readFile(join(process.cwd(), "lib/og/fonts/Poppins-SemiBold.ttf")),
    readFile(join(process.cwd(), "lib/og/fonts/Poppins-Regular.ttf")),
    readFile(join(process.cwd(), "public/logo.svg")),
  ]);
  const logoSrc = `data:image/svg+xml;base64,${logo.toString("base64")}`;
  const fonts = [
    { name: "Poppins", data: semibold, weight: 600 as const, style: "normal" as const },
    { name: "Poppins", data: regular, weight: 400 as const, style: "normal" as const },
  ];

  if (!profile) {
    return new ImageResponse(
      (
        <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", background: "white" }}>
          <img src={logoSrc} width={297} height={100} alt="Nook" />
        </div>
      ),
      { ...size, fonts },
    );
  }

  const [avatar, ...photoSrcs] = await Promise.all([
    inline(profile.avatarUrl),
    ...profile.photos.slice(0, 8).map((p) => inline(p.imageUrl)),
  ]);
  const photos = photoSrcs.filter((s): s is string => s !== null).slice(0, 6);
  const big = photos.length <= 3;
  const tile = big ? { w: 180, h: 225 } : { w: 168, h: 210 };

  const { counts } = profile;
  const stats = [
    counts.cups ? `${counts.cups} ${counts.cups === 1 ? "cup" : "cups"}` : null,
    `${counts.reviews} ${counts.reviews === 1 ? "review" : "reviews"}`,
    counts.ranked ? `${counts.ranked} ranked` : null,
  ]
    .filter(Boolean)
    .join("  ·  ");

  const centred = photos.length === 0;

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
            width: centred ? 900 : 500,
            height: "100%",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: centred ? "center" : "flex-start" }}>
            {avatar ? (
              <img src={avatar} width={128} height={128} alt="" style={{ borderRadius: 999, objectFit: "cover" }} />
            ) : (
              <div
                style={{
                  display: "flex",
                  width: 128,
                  height: 128,
                  borderRadius: 999,
                  background: TIMBERWOLF,
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 56,
                  fontWeight: 600,
                }}
              >
                {profile.name.trim().charAt(0).toUpperCase() || "?"}
              </div>
            )}
            <div
              style={{
                display: "flex",
                marginTop: 28,
                fontSize: profile.name.length > 22 ? 44 : 56,
                fontWeight: 600,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                textAlign: centred ? "center" : "left",
              }}
            >
              {clip(profile.name, 40)}
            </div>
            {profile.hasName ? (
              <div style={{ display: "flex", marginTop: 8, fontSize: 28, color: MUTED }}>@{profile.username}</div>
            ) : null}
            <div style={{ display: "flex", marginTop: 20, fontSize: 26, color: INK }}>{stats}</div>
          </div>
          <img src={logoSrc} width={131} height={44} alt="Nook" />
        </div>

        {photos.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", width: tile.w * 3 + 20, gap: 10, justifyContent: "flex-end" }}>
            {photos.map((src, i) => (
              <img
                key={i}
                src={src}
                width={tile.w}
                height={tile.h}
                alt=""
                style={{ objectFit: "cover", borderRadius: 16, background: PAPER }}
              />
            ))}
          </div>
        ) : null}
      </div>
    ),
    { ...size, fonts },
  );
}
