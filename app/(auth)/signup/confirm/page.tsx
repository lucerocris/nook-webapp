import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { OtpForm } from "./otp-form";

export const metadata: Metadata = { title: "Confirm your email" };

type Props = {
  searchParams: Promise<{ email?: string; next?: string }>;
};

export default function SignupConfirmPage({ searchParams }: Props) {
  return (
    <div className="rounded-2xl border border-line bg-white p-7 shadow-[0_12px_28px_rgba(0,0,0,0.08)]">
      <Suspense fallback={<ConfirmSkeleton />}>
        <ConfirmContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

function ConfirmSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-7 w-48 rounded bg-subtle" />
      <div className="mt-3 h-4 w-full rounded bg-subtle" />
      <div className="mt-6 h-11 w-full rounded-lg bg-subtle" />
      <div className="mt-4 h-10 w-full rounded-md bg-subtle" />
    </div>
  );
}

async function ConfirmContent({ searchParams }: Props) {
  const { email, next } = await searchParams;
  const address = email?.trim() ?? "";

  // Reached without an address there is nothing to verify against — verifyOtp
  // is keyed by email — so send them back to sign up rather than render a form
  // that can only fail.
  if (!address) redirect("/signup");

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink">
        Check your email
      </h1>
      <p className="mt-1 text-sm text-muted">
        We sent a verification code to{" "}
        <span className="font-medium text-ink">{address}</span>. Enter it
        below to finish setting up your account.
      </p>

      <OtpForm email={address} next={next} />
    </>
  );
}
