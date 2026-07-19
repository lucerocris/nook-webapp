"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { headerKey, rateLimit } from "@/lib/rate-limit";

const credentialsSchema = z.object({
  email: z.email("Please enter a valid email.").trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long.")
    .max(72, "Password is too long."),
});

/** Server Actions are ordinary POST endpoints, so both of these are scriptable
 * for credential stuffing and password spraying against an 8-character
 * minimum. Supabase's own GoTrue limits are per-project and generous. */
const AUTH_LIMIT = { limit: 8, windowMs: 60_000 };

/** Fixed responses. Passing Supabase's message through verbatim turned signUp
 * into an account-existence oracle ("User already registered") and disclosed
 * GoTrue's internal rate-limiter state ("you can only request this after N
 * seconds"). The API routes already suppress upstream detail; this brings auth
 * in line. */
const SIGN_IN_FAILED = "Invalid email or password.";
const SIGN_UP_FAILED =
  "We couldn't complete sign-up right now. Please try again in a moment.";
const RATE_LIMITED = "Too many attempts. Please wait a minute and try again.";

/** A relative path, or "/".
 *
 * The previous string check — startsWith("/") and !startsWith("//") — was
 * defeated by a backslash: "/\evil.com" passes both, and browsers normalize
 * "\" to "/" in special-scheme URLs, so it resolves to https://evil.com.
 * Parsing against an opaque base and rejecting anything that escapes the
 * origin removes the whole class rather than patching one character. */
function safeNext(next: FormDataEntryValue | string | null | undefined): string {
  if (typeof next !== "string" || !next) return "/";
  const base = "https://nook.invalid";
  let url: URL;
  try {
    url = new URL(next, base);
  } catch {
    return "/";
  }
  if (url.origin !== base) return "/";
  return `${url.pathname}${url.search}${url.hash}`;
}

async function authRateLimitKey(prefix: string): Promise<string> {
  return headerKey(await headers(), prefix);
}

export type AuthState = { error?: string } | undefined;

export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  if (!rateLimit(await authRateLimitKey("signin"), AUTH_LIMIT).ok) {
    return { error: RATE_LIMITED };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    console.error("[auth] sign-in failed", error.message);
    return { error: SIGN_IN_FAILED };
  }

  redirect(safeNext(formData.get("next")));
}

export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  if (!rateLimit(await authRateLimitKey("signup"), AUTH_LIMIT).ok) {
    return { error: RATE_LIMITED };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp(parsed.data);
  if (error) {
    console.error("[auth] sign-up failed", error.message);
    return { error: SIGN_UP_FAILED };
  }

  redirect(safeNext(formData.get("next")));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
