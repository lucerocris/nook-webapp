"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ShareNetwork } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";

type Props = {
  /** Share-sheet headline, e.g. the cafe name. */
  title: string;
  /** One-line context under the headline in native share sheets. */
  text?: string;
  /** Extra classes for the button itself — used by the over-photo variant. */
  className?: string;
};

type Feedback = "copied" | "failed" | null;

/**
 * Share the current page. Native share sheet where the browser has one
 * (mobile, some desktops); otherwise copies the link and says so — a share
 * button that silently does nothing reads as broken, which is exactly what
 * this replaced.
 */
export default function ShareButton({ title, text, className }: Props) {
  const [feedback, setFeedback] = useState<Feedback>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  const flash = (state: Exclude<Feedback, null>) => {
    setFeedback(state);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setFeedback(null), 2000);
  };

  const share = async () => {
    // Query params (search state, UTM noise) don't belong in a shared link;
    // the canonical path does.
    const url = `${window.location.origin}${window.location.pathname}`;

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (error) {
        // Closing the sheet without picking a target is a choice, not a
        // failure — no feedback, no fallback.
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        // Anything else (NotAllowedError, data rejected): fall through to
        // the clipboard.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      flash("copied");
    } catch {
      flash("failed");
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Share cafe"
        onClick={share}
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-[#3b3b3b] transition-colors hover:bg-zinc-50",
          className,
        )}
      >
        {feedback === "copied" ? (
          <Check size={18} className="text-[#3A5A40]" />
        ) : (
          <ShareNetwork size={18} />
        )}
      </button>
      <span
        role="status"
        className={`pointer-events-none absolute right-0 top-11 z-10 whitespace-nowrap rounded-full bg-[#101514] px-3 py-1.5 text-xs text-white transition-opacity duration-150 ${
          feedback ? "opacity-100" : "opacity-0"
        }`}
      >
        {feedback === "failed" ? "Couldn't copy the link" : "Link copied"}
      </span>
    </div>
  );
}
