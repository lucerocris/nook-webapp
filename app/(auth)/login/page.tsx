"use client";

import Link from "next/link";
import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn, type AuthState } from "../actions";

/** useSearchParams needs a Suspense boundary above it to prerender, so the
 * form sits inside one rather than the page reading the param directly. */
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginForm />}>
      <LoginFormWithNotice />
    </Suspense>
  );
}

function LoginFormWithNotice() {
  const failedConfirmation =
    useSearchParams().get("error") === "confirmation_failed";
  return <LoginForm failedConfirmation={failedConfirmation} />;
}

function LoginForm({
  failedConfirmation = false,
}: {
  failedConfirmation?: boolean;
}) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    signIn,
    undefined,
  );

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-7 shadow-[0_12px_28px_rgba(0,0,0,0.08)]">
      <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[#101514]">
        Welcome back
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Sign in to save cafes and pick up where you left off.
      </p>

      {/* The confirmation link expired or had already been used. The code in
          the same email is the other way in, so point back at sign-up rather
          than leaving a dead end. */}
      {failedConfirmation && !state?.error && (
        <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
          That confirmation link is no longer valid. Sign in below, or{" "}
          <Link href="/signup" className="font-medium underline">
            start sign-up again
          </Link>{" "}
          to get a new code.
        </p>
      )}

      <form action={formAction} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-[#101514]">Email</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            className="mt-1.5 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-[#101514] outline-none transition-colors focus:border-[#31533f]"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[#101514]">Password</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            minLength={8}
            className="mt-1.5 block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-[#101514] outline-none transition-colors focus:border-[#31533f]"
          />
        </label>

        {state?.error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="flex h-10 w-full items-center justify-center rounded-md bg-[#31533f] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#294635] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-zinc-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-[#31533f] hover:underline"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
