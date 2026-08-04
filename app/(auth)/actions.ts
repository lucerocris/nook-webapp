"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/env";
import { headerKey, rateLimit } from "@/lib/rate-limit";
import { safeNext } from "@/lib/safe-next";

const credentialsSchema = z.object({
  email: z.email("Please enter a valid email.").trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long.")
    .max(72, "Password is too long."),
});

/** Supabase's `mailer_otp_length` is project-wide and settable to 6–10, and all
 * six Nook apps share one project — so the code length here is not this app's
 * to decide. Accept the whole range rather than pinning to today's value;
 * `nook-business` and `nook-mobile` do the same, deliberately, so that changing
 * the dashboard setting never strands a client that rejects the codes the
 * project now sends. */
const otpSchema = z.object({
  email: z.email().trim().toLowerCase(),
  token: z.string().trim().regex(/^\d{6,10}$/, "Enter the code we emailed you."),
});

/** Server Actions are ordinary POST endpoints, so both of these are scriptable
 * for credential stuffing and password spraying against an 8-character
 * minimum. Supabase's own GoTrue limits are per-project and generous. */
const AUTH_LIMIT = { limit: 8, windowMs: 60_000 };

/** Each resend sends a real email, so this is tighter than AUTH_LIMIT — an
 * unthrottled resend button is a mail bomb aimed at whatever address the
 * attacker types, and it burns the project's Resend quota. */
const RESEND_LIMIT = { limit: 3, windowMs: 60_000 };

/** Fixed responses. Passing Supabase's message through verbatim turned signUp
 * into an account-existence oracle ("User already registered") and disclosed
 * GoTrue's internal rate-limiter state ("you can only request this after N
 * seconds"). The API routes already suppress upstream detail; this brings auth
 * in line. */
const SIGN_IN_FAILED = "Invalid email or password.";
const SIGN_UP_FAILED =
  "We couldn't complete sign-up right now. Please try again in a moment.";
const RATE_LIMITED = "Too many attempts. Please wait a minute and try again.";
const OTP_FAILED = "That code is incorrect or has expired.";
const RESEND_FAILED = "We couldn't send a new code. Please try again shortly.";

async function authRateLimitKey(prefix: string): Promise<string> {
  return headerKey(await headers(), prefix);
}

/** Destination for the "Confirm Email Address" button in the signup email —
 * the tap-the-link fallback for people who won't type a code, handled by
 * `app/auth/confirm/route.ts`.
 *
 * Built from SITE_URL rather than the request's Host header on purpose: the
 * host is attacker-controllable, and this URL is emailed to the user, so
 * trusting it would let someone point a Nook confirmation link at their own
 * domain. Supabase must also allow-list this URL under Auth → URL
 * Configuration, or GoTrue falls back to the project's Site URL. */
function confirmUrl(next: string): string {
  const url = new URL("/auth/confirm", SITE_URL);
  if (next !== "/") url.searchParams.set("next", next);
  return url.toString();
}

/** `sent` is only ever set by resendSignupOtp — the one action here whose
 * success does not end in a redirect, so it has to report back to the form. */
export type AuthState = { error?: string; sent?: boolean } | undefined;

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

  const next = safeNext(formData.get("next"));

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    ...parsed.data,
    options: {
      emailRedirectTo: confirmUrl(next),
      data: {
        // Switches the shared "Confirm signup" template
        // (nook-supabase/supabase/templates/confirmation.html) to its
        // `{{ if .Data.otp_signup }}` branch, which renders `{{ .Token }}`.
        // Without this flag the email is link-only and there is no code to
        // type — the template's comment listing which apps set it is now
        // out of date: this one does too.
        otp_signup: true,
      },
    },
  });
  if (error) {
    console.error("[auth] sign-up failed", error.message);
    return { error: SIGN_UP_FAILED };
  }

  // The account exists but is unconfirmed, so there is no session yet. Carry
  // the address (verifyOtp needs it) and the original destination to the code
  // entry screen. Signing up with an already-registered address lands here too
  // — GoTrue returns a decoy user rather than an error, which is what keeps
  // this flow from being an account-existence oracle.
  const params = new URLSearchParams({ email: parsed.data.email });
  if (next !== "/") params.set("next", next);
  redirect(`/signup/confirm?${params.toString()}`);
}

/** Confirms a new account with the code from the signup email. On success this
 * establishes a session, exactly like signIn. */
export async function verifySignupOtp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = otpSchema.safeParse({
    email: formData.get("email"),
    token: formData.get("token"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  // The guess space is only 10^6 at the shortest allowed length, so this limit
  // is the difference between a code that expires unguessed and one that
  // doesn't. GoTrue applies its own per-project ceiling on top.
  if (!rateLimit(await authRateLimitKey("otp"), AUTH_LIMIT).ok) {
    return { error: RATE_LIMITED };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email: parsed.data.email,
    token: parsed.data.token,
    type: "signup",
  });
  if (error) {
    console.error("[auth] otp verification failed", error.message);
    return { error: OTP_FAILED };
  }

  redirect(safeNext(formData.get("next")));
}

/** Re-sends the signup email. The code is regenerated, and the tap-the-link
 * path in the same email keeps working, so `emailRedirectTo` is rebuilt with
 * the same destination signUp threaded through — otherwise "Resend" quietly
 * drops it and the user lands on the homepage after confirming. */
export async function resendSignupOtp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = z
    .email()
    .trim()
    .toLowerCase()
    .safeParse(formData.get("email"));
  if (!parsed.success) {
    return { error: "Please enter a valid email." };
  }

  if (!rateLimit(await authRateLimitKey("otp-resend"), RESEND_LIMIT).ok) {
    return { error: RATE_LIMITED };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data,
    options: { emailRedirectTo: confirmUrl(safeNext(formData.get("next"))) },
  });
  if (error) {
    console.error("[auth] otp resend failed", error.message);
    return { error: RESEND_FAILED };
  }

  return { sent: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
