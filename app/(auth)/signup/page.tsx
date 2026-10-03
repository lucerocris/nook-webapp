"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp, type AuthState } from "../actions";

export default function SignupPage() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    signUp,
    undefined,
  );

  return (
    <div className="rounded-2xl border border-line bg-white p-7 shadow-[0_12px_28px_rgba(0,0,0,0.08)]">
      <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink">
        Create your account
      </h1>
      <p className="mt-1 text-sm text-muted">
        Save cafes, write reviews, and find your next study spot.
      </p>

      <form action={formAction} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-ink">Email</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            className="mt-1.5 block w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-brand"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">Password</span>
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="mt-1.5 block w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-brand"
          />
          <span className="mt-1 block text-[11px] text-muted">
            At least 8 characters.
          </span>
        </label>

        {state?.error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="flex h-10 w-full items-center justify-center rounded-md bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-muted">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-brand hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
