"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";

/**
 * For someone who already has Nook: the code to type into the app (Sora's
 * code tray: heading, one line, one cell per character, then the copy
 * action; Classroom's code as the largest thing on the panel and its separate
 * "copied" notice; Discord's one note line under the code;
 * docs/references/crawl-link).
 *
 * The app does not open these links by itself yet, so the code is the way
 * in: Saved → Crawls → Enter a code takes a crawl code or a crew code.
 */
export default function CrawlJoinCode({
  code,
  kind,
  note,
}: {
  code: string;
  kind: "crew" | "crawl";
  note: string;
}) {
  const [copied, setCopied] = useState<"ok" | "failed" | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function copy() {
    let ok = false;
    try {
      await navigator.clipboard.writeText(code);
      ok = true;
    } catch {
      ok = false;
    }
    setCopied(ok ? "ok" : "failed");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(null), 2200);
  }

  const label = kind === "crew" ? "Crew code" : "Crawl code";

  return (
    <section
      id="join"
      aria-labelledby="join-title"
      className="scroll-mt-24 rounded-[20px] border border-line p-5 sm:p-6"
    >
      <h2 id="join-title" className="text-lg font-semibold tracking-[-0.01em] text-ink">
        Already have Nook?
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-body">
        Open the <span className="font-medium text-ink">Saved</span> tab, tap{" "}
        <span className="font-medium text-ink">Enter a code</span> next to Crawls, and type:
      </p>

      <p className="mt-4 text-[13px] font-medium text-muted">{label}</p>
      <div
        className="mt-1.5 flex gap-1 rounded-2xl bg-paper p-1.5 sm:gap-1.5 sm:p-2"
        role="group"
        aria-label={`${label} ${code.split("").join(" ")}`}
      >
        {code.split("").map((ch, i) => (
          <span
            key={i}
            aria-hidden
            className="flex h-12 min-w-0 flex-1 items-center justify-center rounded-lg bg-white text-lg font-semibold text-ink tabular-nums shadow-[0_1px_0_rgba(15,35,20,0.06)] sm:h-14 sm:text-xl"
          >
            {ch}
          </span>
        ))}
      </div>
      <p className="mt-2 text-[13px] text-muted">{note}</p>

      <button
        type="button"
        onClick={copy}
        className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-full border border-line-strong bg-white px-5 text-sm font-medium text-ink transition-colors hover:bg-subtle active:bg-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:w-auto"
      >
        {copied === "ok" ? (
          <Check size={18} weight="bold" className="text-brand" aria-hidden />
        ) : (
          <Copy size={18} aria-hidden />
        )}
        {copied === "ok" ? "Copied" : "Copy code"}
      </button>

      <div
        aria-live="polite"
        className={cn(
          "pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 transition-opacity duration-200",
          copied ? "opacity-100" : "opacity-0",
        )}
      >
        {copied ? (
          <span className="rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-white shadow-float">
            {copied === "ok" ? `${label} copied` : "Couldn't copy. Select the code and copy it instead."}
          </span>
        ) : null}
      </div>
    </section>
  );
}
