"use client";

import { createElement, useEffect, useId, useRef, useState } from "react";
import { X } from "@phosphor-icons/react";

import type { Tag } from "@/lib/data/cafes-mappers";
import { getTagIcon } from "@/lib/utils/tag-icon";

const PREVIEW_LIMIT = 5;

type Props = {
  amenities: Tag[];
  bestFor: Tag[];
  payment: Tag[];
};

export default function CafeTagsOverview({
  amenities,
  bestFor,
  payment,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const groups = [
    { title: "Amenities", items: amenities },
    { title: "Best For", items: bestFor },
    { title: "Payment", items: payment },
  ];
  const hasMore = groups.some(({ items }) => items.length > PREVIEW_LIMIT);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="mt-5 text-sm text-[#101514]">
      <div className="grid gap-7 sm:grid-cols-3">
        {groups.map((group) => (
          <TagColumn
            key={group.title}
            title={group.title}
            items={group.items.slice(0, PREVIEW_LIMIT)}
          />
        ))}
      </div>

      {hasMore ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="mt-5 text-sm font-medium text-[#31533f] underline underline-offset-4 transition-colors hover:text-[#243f30]"
        >
          See more
        </button>
      ) : null}

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="max-h-[85vh] w-full overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-w-lg sm:rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-5">
              <h2
                id={titleId}
                className="text-lg font-semibold text-[#2f2f2f]"
              >
                Cafe details
              </h2>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close cafe details"
                className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[calc(85vh-80px)] overflow-y-auto px-6 py-5">
              <div className="grid gap-8">
                {groups.map((group) => (
                  <TagColumn
                    key={group.title}
                    title={group.title}
                    items={group.items}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TagColumn({ title, items }: { title: string; items: Tag[] }) {
  return (
    <div>
      <h3 className="text-sm font-normal text-[#8b8b8b]">{title}</h3>
      <div className="mt-4 space-y-4">
        {items.length > 0 ? (
          items.map((tag) => <TagRow key={tag.id} tag={tag} />)
        ) : (
          <p className="text-sm text-zinc-400">—</p>
        )}
      </div>
    </div>
  );
}

function TagRow({ tag }: { tag: Tag }) {
  return (
    <div className="flex items-center gap-3">
      {createElement(getTagIcon(tag.name), {
        size: 17,
        className: "shrink-0 text-[#101514]",
      })}
      <span>{tag.name}</span>
    </div>
  );
}
