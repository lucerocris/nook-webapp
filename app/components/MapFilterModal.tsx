"use client";

import { useEffect, useState } from "react";
import { X } from "@phosphor-icons/react";
import {
  MapPin,
  Sparkle,
  Star,
  TrendUp,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";

import { getTagIcon } from "@/lib/utils/tag-icon";

// Hardcoded filter labels — mirrors the nook-mobile map filter sheet
// (`map_filter_content.dart`). Keep these in sync with the mobile app.
export const BEST_FOR_LABELS = [
  "Date Spot",
  "Solo Work / Study",
  "Group Hangout",
  "Book Cafe",
  "Late Night",
  "Quick Coffee",
  "Family Friendly",
  "Nature Cafe",
  "Special Occasion",
  "Specialty Coffee",
  "Student Friendly",
  "Aesthetic / IG-worthy",
  "Community Space",
];

export const AMENITY_LABELS = [
  "Free WiFi",
  "Power Outlets",
  "Air Conditioned",
  "Outdoor Seating",
  "Parking Available",
  "Reservations Accepted",
  "Private Rooms",
  "Wheelchair Accessible",
  "Takeaway Available",
  "Smoking Area",
  "Open 24 Hours",
  "Pet Friendly",
];

export const PAYMENT_LABELS = ["Cash", "E-wallet", "Card"];

export const ALL_FILTER_LABELS = [
  ...BEST_FOR_LABELS,
  ...AMENITY_LABELS,
  ...PAYMENT_LABELS,
];

export type SortId = "nearby" | "top_rated" | "trending" | "newest";

export const SORT_OPTIONS: { id: SortId; label: string; icon: Icon }[] = [
  { id: "nearby", label: "Nearby", icon: MapPin },
  { id: "top_rated", label: "Top rated", icon: Star },
  { id: "trending", label: "Trending", icon: TrendUp },
  { id: "newest", label: "Newest", icon: Sparkle },
];

type Props = {
  onClose: () => void;
  initialTags: string[];
  onApply: (tags: string[]) => void;
  onClearAll: () => void;
  /** Live result count for a draft selection, or null when it can't be known
   * without a new request (e.g. the draft drops a tag that's already applied,
   * so the loaded set is narrower than what the draft would return). */
  previewCount: (tags: string[]) => number | null;
};

/**
 * Centered dialog (a bottom sheet on phones): title bar with close, grouped
 * toggle chips scrolling in the body, and a pinned footer with "Clear all" on
 * the left and a primary carrying the live count on the right. With nothing
 * matching, the primary goes muted and says so.
 *
 * Mounted only while open, so the draft initializes from the applied filters.
 */
export default function MapFilterModal({
  onClose,
  initialTags,
  onApply,
  onClearAll,
  previewCount,
}: Props) {
  const [tags, setTags] = useState<Set<string>>(new Set(initialTags));

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const toggleTag = (label: string) => {
    setTags((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const draft = Array.from(tags);
  const count = previewCount(draft);
  const none = count === 0;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Filters"
      onClick={onClose}
    >
      <div
        className="flex max-h-[88dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-[var(--radius-card)] bg-white shadow-float sm:rounded-[var(--radius-card)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex shrink-0 items-center justify-center border-b border-line px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="absolute left-3 flex size-9 items-center justify-center rounded-full text-ink transition-colors hover:bg-subtle"
          >
            <X size={18} weight="bold" />
          </button>
          <h2 className="text-base font-semibold text-ink">Filters</h2>
        </div>

        <div className="flex-1 divide-y divide-line overflow-y-auto px-6">
          <FilterSection title="Amenities">
            <TagWrap labels={AMENITY_LABELS} selected={tags} onToggle={toggleTag} />
          </FilterSection>
          <FilterSection title="Best for">
            <TagWrap labels={BEST_FOR_LABELS} selected={tags} onToggle={toggleTag} />
          </FilterSection>
          <FilterSection title="Payment accepted">
            <TagWrap labels={PAYMENT_LABELS} selected={tags} onToggle={toggleTag} />
          </FilterSection>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-line px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => {
              setTags(new Set());
              onClearAll();
            }}
            disabled={tags.size === 0 && initialTags.length === 0}
            className="text-sm font-semibold text-ink underline underline-offset-4 disabled:text-line-strong disabled:no-underline"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={() => onApply(draft)}
            disabled={none}
            className="h-12 rounded-xl bg-ink px-6 text-sm font-semibold text-white transition-colors hover:bg-brand disabled:bg-line disabled:text-muted"
          >
            {count === null
              ? "Show cafes"
              : none
                ? "No cafes match"
                : `Show ${count} ${count === 1 ? "cafe" : "cafes"}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="py-6">
      <h3 className="mb-4 text-base font-semibold text-ink">{title}</h3>
      {children}
    </section>
  );
}

function TagWrap({
  labels,
  selected,
  onToggle,
}: {
  labels: string[];
  selected: Set<string>;
  onToggle: (label: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {labels.map((label) => {
        const TagIcon = getTagIcon(label);
        const isSelected = selected.has(label);
        return (
          <button
            key={label}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onToggle(label)}
            className={[
              "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm transition-colors",
              isSelected
                ? "border-ink bg-ink font-medium text-white"
                : "border-line-strong text-body hover:border-ink",
            ].join(" ")}
          >
            <TagIcon size={16} weight={isSelected ? "fill" : "regular"} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
