"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CircleNotch, NavigationArrow, X } from "@phosphor-icons/react";


const DISMISS_KEY = "nook:nearby-dismissed";

type State = "idle" | "locating" | "blocked" | "failed" | "unsupported";

const noopSubscribe = () => () => {};

function readDismissed(): boolean {
  try {
    return sessionStorage.getItem(DISMISS_KEY) !== null;
  } catch {
    // Storage blocked: the prompt just shows again.
    return false;
  }
}

const COPY: Record<State, string> = {
  idle: "Share your location once to add a Near you shelf with distances.",
  locating: "Finding where you are…",
  blocked:
    "Location is blocked for this site. Allow it from the icon beside the address bar, then try again.",
  failed: "Couldn't read your location just now. Try again in a moment.",
  unsupported: "This browser can't share a location. The map shows every cafe instead.",
};

/**
 * Where the Near you shelf goes before location is known: one tinted banner
 * with an icon, a title over one line, the action, and a dismiss pinned to the
 * trailing edge (structure kept from docs/references/webapp: Netflix, Patreon).
 * Dismissing hides it for this browser session.
 */
export default function NearbyPrompt() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<State>("idle");
  const [dismissed, setDismissed] = useState(false);
  const [pending, startTransition] = useTransition();

  // Read after hydration only (the server snapshot is "not dismissed").
  const storedDismissal = useSyncExternalStore(noopSubscribe, readDismissed, () => false);

  if (dismissed || storedDismissal) return null;

  function dismiss() {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  }

  function locate() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState("unsupported");
      return;
    }
    setState("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("lat", position.coords.latitude.toFixed(3));
        params.set("lng", position.coords.longitude.toFixed(3));
        startTransition(() => {
          router.push(`/?${params.toString()}`, { scroll: false });
        });
      },
      (geoError) => {
        setState(geoError.code === geoError.PERMISSION_DENIED ? "blocked" : "failed");
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  const busy = state === "locating" || pending;
  const canAct = state === "idle" || state === "failed" || state === "blocked" || busy;

  return (
    <section aria-labelledby="near-you" className="pt-10 sm:pt-12">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-8">
        <div className="relative flex flex-col gap-3 rounded-[20px] bg-brand-soft p-4 pr-14 sm:flex-row sm:items-center sm:gap-4 sm:p-5 sm:pr-16">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-brand">
            <NavigationArrow size={18} weight="fill" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="near-you" className="text-sm font-semibold text-ink">
              See cafes near you
            </h2>
            <p aria-live="polite" className="mt-0.5 text-sm text-body">
              {busy ? COPY.locating : COPY[state]}
            </p>
          </div>
          {canAct ? (
            <button
              type="button"
              onClick={locate}
              disabled={busy}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-full bg-brand px-5 text-sm font-medium text-white transition-colors hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-70 sm:self-auto"
            >
              {busy ? <CircleNotch size={16} className="animate-spin" aria-hidden /> : null}
              {busy ? "Locating…" : state === "idle" ? "Use my location" : "Try again"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss"
            className="absolute right-2 top-2 flex size-11 items-center justify-center rounded-full text-body transition-colors hover:bg-white/70 focus-visible:outline-2 focus-visible:outline-brand sm:top-1/2 sm:-translate-y-1/2"
          >
            <X size={16} aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
}
