"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export type SectionTab = { id: string; label: string };

/**
 * Jump links to the page's sections, pinned under the top bar (Expedia's tab
 * row under the photos). The section scrolled to is underlined. Plain anchors, so
 * they work without JavaScript and the URL hash says where you are.
 */
export default function SectionTabs({
  tabs,
  className,
}: {
  tabs: SectionTab[];
  /** Overrides, e.g. a pinned offset on pages that keep the navbar on phones. */
  className?: string;
}) {
  const [current, setCurrent] = useState(tabs[0]?.id);

  // The current section is the last one whose top has passed just under the
  // pinned bars; above the first one, it is the first.
  useEffect(() => {
    const els = tabs
      .map((t) => document.getElementById(t.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (els.length === 0) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = 140;
      let id = els[0].id;
      for (const el of els) {
        if (el.getBoundingClientRect().top <= line) id = el.id;
      }
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      setCurrent(atBottom ? els[els.length - 1].id : id);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [tabs]);

  return (
    <nav
      aria-label="Sections"
      className={cn(
        "sticky top-0 z-30 -mx-4 mt-4 border-b border-line bg-white px-4 sm:-mx-8 sm:px-8 lg:top-16 lg:mx-0 lg:mt-6 lg:px-0",
        className,
      )}
    >
      <ul className="no-scrollbar flex gap-6 overflow-x-auto">
        {tabs.map((tab) => (
          <li key={tab.id} className="shrink-0">
            <a
              href={`#${tab.id}`}
              aria-current={current === tab.id ? "location" : undefined}
              className={cn(
                "flex h-12 items-center border-b-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand",
                current === tab.id
                  ? "border-ink text-ink"
                  : "border-transparent text-muted hover:text-ink",
              )}
            >
              {tab.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
