"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type Category = { key: string; title: string; count: number };

/**
 * Category anchors. A sticky rail beside the list from `lg`; a sticky,
 * horizontally scrolling tab row under the header below that. The entry for
 * the section currently at the top of the viewport is marked active.
 */
export default function MenuCategoryNav({ categories }: { categories: Category[] }) {
  const [active, setActive] = useState(categories[0]?.key);

  useEffect(() => {
    const sections = categories
      .map((c) => document.getElementById(`cat-${c.key}`))
      .filter((el): el is HTMLElement => el !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id.replace(/^cat-/, ""));
      },
      { rootMargin: "-120px 0px -60% 0px" },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [categories]);

  useEffect(() => {
    document
      .getElementById(`tab-${active}`)
      ?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [active]);

  return (
    <>
      <nav
        aria-label="Menu categories"
        className="no-scrollbar sticky top-16 z-20 -mx-4 flex gap-1.5 overflow-x-auto border-b border-line bg-white/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8 lg:hidden"
      >
        {categories.map((c) => (
          <a
            key={c.key}
            id={`tab-${c.key}`}
            href={`#cat-${c.key}`}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              active === c.key ? "bg-ink text-white" : "text-body hover:bg-subtle",
            )}
          >
            {c.title}
          </a>
        ))}
      </nav>

      <nav aria-label="Menu categories" className="hidden lg:block">
        <ul className="sticky top-24 space-y-0.5">
          {categories.map((c) => (
            <li key={c.key}>
              <a
                href={`#cat-${c.key}`}
                className={cn(
                  "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                  active === c.key
                    ? "bg-subtle font-semibold text-ink"
                    : "text-body hover:bg-subtle",
                )}
              >
                {c.title}
                <span className="text-xs text-muted">{c.count}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
