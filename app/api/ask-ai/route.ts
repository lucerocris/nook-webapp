import { NextResponse } from "next/server";
import { z } from "zod";

import { askAi } from "@/lib/data/ai-search";
import { clientKey, rateLimit } from "@/lib/rate-limit";

/** Each request costs two paid Gemini calls (embedding + generation), so an
 * unmetered public endpoint is a direct billing risk. These caps are
 * per-instance best-effort — pair them with a hard spend limit in the Google
 * Cloud billing console, which is the only bypass-proof control. */
const PER_IP = { limit: 10, windowMs: 60_000 };
const GLOBAL = { limit: 300, windowMs: 60_000 };

/** Only the last few turns meaningfully steer the answer, and an unbounded
 * message would inflate the prompt, so we bound the payload here. */
const MAX_MESSAGE_LENGTH = 500;
const MAX_HISTORY = 8;

const bodySchema = z.object({
  message: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH),
  conversation: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(2000),
      }),
    )
    .max(MAX_HISTORY)
    .optional(),
  city: z.string().max(100).optional(),
  // Upper bound matches the edge function's own clamp; omitting it lets the
  // function pick its default retrieval breadth.
  limit: z.number().int().min(1).max(25).optional(),
});

export async function POST(request: Request) {
  const perIp = rateLimit(clientKey(request, "ask-ai"), PER_IP);
  const global = rateLimit("ask-ai:global", GLOBAL);

  if (!perIp.ok || !global.ok) {
    const retryAfter = Math.max(perIp.retryAfterSeconds, global.retryAfterSeconds);
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    // Don't echo Zod issues — they disclose the internal schema shape.
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const result = await askAi(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    // Surface a generic message: upstream errors may carry provider details.
    console.error("[ask-ai] request failed", error);
    return NextResponse.json(
      { error: "The cafe assistant is unavailable right now." },
      { status: 502 },
    );
  }
}
