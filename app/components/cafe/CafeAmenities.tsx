"use client";

import { createElement, useEffect, useId, useRef, useState } from "react";
import { X } from "@phosphor-icons/react";

import type { Tag } from "@/lib/data/cafes-mappers";
import { getTagIcon } from "@/lib/utils/tag-icon";

const PREVIEW = 8;
/** Up to this many tags, everything shows inline, grouped; past it, a preview and the dialog. */
const INLINE_ALL = 12;

type Group = { title: string; items: Tag[] };

/**
 * What the cafe offers (Airbnb's section): the first eight tags, featured
 * first, as a two-column icon + label grid, then "Show all N" when there are
 * more. The dialog lists everything in one column per group, each under its
 * own heading (Trip's list, repeated per group).
 */
export default function CafeAmenities({
  amenities,
  bestFor,
  payment,
}: {
  amenities: Tag[];
  bestFor: Tag[];
  payment: Tag[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  const groups: Group[] = [
    { title: "Good for", items: bestFor },
    { title: "Amenities", items: amenities },
    { title: "Payment", items: payment },
  ].filter((g) => g.items.length > 0);

  const all = [...amenities, ...bestFor, ...payment];
  const preview = [...all.filter((t) => t.isFeatured), ...all.filter((t) => !t.isFeatured)].slice(0, PREVIEW);
  const total = all.length;
  const hasMore = total > preview.length;

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  if (total === 0) {
    return <p className="text-sm text-muted">No amenities listed yet.</p>;
  }

  // A short list is read faster grouped and whole than as a preview with a
  // "Show all" behind it, which hid payment options on most cafes.
  if (total <= INLINE_ALL) {
    return (
      <div className="space-y-6">
        {groups.map((group) => (
          <section key={group.title}>
            <h3 className="text-sm font-semibold text-ink">{group.title}</h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {group.items.map((tag) => (
                <li
                  key={tag.id}
                  className="inline-flex h-9 items-center gap-2 rounded-full border border-line px-3.5 text-[14px] text-body"
                >
                  {createElement(getTagIcon(tag.name), {
                    size: 17,
                    className: "shrink-0 text-fern",
                    "aria-hidden": true,
                  })}
                  {tag.name}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    );
  }

  return (
    <div>
      <ul className="grid grid-cols-1 gap-x-8 gap-y-4 min-[420px]:grid-cols-2">
        {preview.map((tag) => (
          <li key={tag.id} className="flex items-center gap-3 text-[15px] text-body">
            {createElement(getTagIcon(tag.name), {
              size: 22,
              className: "shrink-0 text-ink",
              "aria-hidden": true,
            })}
            {tag.name}
          </li>
        ))}
      </ul>

      {hasMore ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="mt-7 inline-flex h-11 items-center rounded-full border border-brand px-5 text-sm font-semibold text-brand transition-colors hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          Show all {total}
        </button>
      ) : null}

      {isOpen ? (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 sm:items-center sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="flex max-h-[85dvh] w-full flex-col overflow-hidden rounded-t-[var(--radius-card)] bg-white shadow-float sm:max-w-xl sm:rounded-[var(--radius-card)]"
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <h2 id={titleId} className="text-base font-semibold text-ink">
                What this cafe offers
              </h2>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
                className="flex size-10 items-center justify-center rounded-full text-body transition-colors hover:bg-paper"
              >
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
              {groups.map((group) => (
                <GroupRow key={group.title} group={group} />
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function GroupRow({ group }: { group: Group }) {
  return (
    <section className="border-b border-line py-5 last:border-b-0">
      <h3 className="text-base font-semibold text-ink">{group.title}</h3>
      <ul className="mt-3">
        {group.items.map((tag) => (
          <li key={tag.id} className="flex items-center gap-3 border-b border-line py-3.5 text-[15px] text-body last:border-b-0">
            {createElement(getTagIcon(tag.name), {
              size: 22,
              className: "shrink-0 text-ink",
              "aria-hidden": true,
            })}
            {tag.name}
          </li>
        ))}
      </ul>
    </section>
  );
}
