"use client";

import { useRouter } from "next/navigation";
import { CaretLeft } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

/**
 * Mobile back control for the cafe detail page, which hides the global navbar
 * below `lg`.
 *
 * Prefers real history so "back" returns to wherever the cafe was found — a
 * search, the map, a row on the home page — rather than always dumping the
 * visitor at the top of the site. A direct landing (shared link, search engine)
 * has no in-app history to return to, so that case falls back to home.
 */
export default function BackButton({ className }: Props) {
  const router = useRouter();

  const goBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label="Go back"
      className={cn(
        "flex h-11 w-11 items-center justify-center rounded-full border border-black/5",
        // Legible over a photo or over the page background either way.
        "bg-white/90 text-ink shadow-sm backdrop-blur transition-colors hover:bg-white",
        className,
      )}
    >
      <CaretLeft size={20} />
    </button>
  );
}
