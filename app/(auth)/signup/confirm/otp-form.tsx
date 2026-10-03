"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import {
  resendSignupOtp,
  verifySignupOtp,
  type AuthState,
} from "../../actions";

/** Matches the server's `otpSchema`: Supabase's OTP length is a project-wide
 * setting anywhere in 6–10, so the field must not assume today's value. */
const MIN_CODE_LENGTH = 6;
const MAX_CODE_LENGTH = 10;

export function OtpForm({ email, next }: { email: string; next?: string }) {
  const [code, setCode] = useState("");

  const [verifyState, verifyAction, verifying] = useActionState<
    AuthState,
    FormData
  >(verifySignupOtp, undefined);

  const [resendState, resendAction, resending] = useActionState<
    AuthState,
    FormData
  >(resendSignupOtp, undefined);

  return (
    <>
      <form action={verifyAction} className="mt-6 space-y-4">
        <input type="hidden" name="email" value={email} />
        {next && <input type="hidden" name="next" value={next} />}

        <label className="block">
          <span className="text-sm font-medium text-ink">
            Verification code
          </span>
          <input
            name="token"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            required
            maxLength={MAX_CODE_LENGTH}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="mt-1.5 block w-full rounded-lg border border-line bg-white px-3 py-2.5 text-center font-mono text-lg tracking-[0.4em] text-ink outline-none transition-colors focus:border-brand"
          />
        </label>

        {verifyState?.error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
            {verifyState.error}
          </p>
        )}
        {resendState?.error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
            {resendState.error}
          </p>
        )}
        {resendState?.sent && !resendState.error && (
          <p className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            We sent a new code.
          </p>
        )}

        <button
          type="submit"
          disabled={verifying || code.length < MIN_CODE_LENGTH}
          className="flex h-10 w-full items-center justify-center rounded-md bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {verifying ? "Verifying..." : "Verify and continue"}
        </button>
      </form>

      {/* Its own form so submitting a code and asking for a new one stay
          independent — nesting them would make the resend button submit the
          code field too. */}
      <form action={resendAction} className="mt-4 text-center">
        <input type="hidden" name="email" value={email} />
        {next && <input type="hidden" name="next" value={next} />}
        <button
          type="submit"
          disabled={resending}
          className="text-xs font-medium text-muted transition-colors hover:text-brand disabled:cursor-not-allowed disabled:opacity-60"
        >
          {resending ? "Sending..." : "Didn't get a code? Resend"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-muted">
        Wrong address?{" "}
        <Link
          href="/signup"
          className="font-medium text-brand hover:underline"
        >
          Start over
        </Link>
      </p>
    </>
  );
}
