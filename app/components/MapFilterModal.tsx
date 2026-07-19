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

const SORT_OPTIONS: { id: SortId; label: string; icon: Icon }[] = [
  { id: "nearby", label: "Nearby", icon: MapPin },
  { id: "top_rated", label: "Top rated", icon: Star },
  { id: "trending", label: "Trending", icon: TrendUp },
  { id: "newest", label: "Newest", icon: Sparkle },
];

const ACCENT = "#3A5A40";

type Props = {
  onClose: () => void;
  initialSort: SortId;
  initialTags: string[];
  onApply: (sort: SortId, tags: string[]) => void;
  onClearAll: () => void;
};

// This component is mounted only while the modal is open (the parent renders it
// conditionally), so the draft state initializes from the applied filters on
// mount — no resetting effect required.
export default function MapFilterModal({
  onClose,
  initialSort,
  initialTags,
  onApply,
  onClearAll,
}: Props) {
  const [sort, setSort] = useState<SortId>(initialSort);
  const [tags, setTags] = useState<Set<string>>(new Set(initialTags));

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const toggleTag = (label: string) => {
    setTags((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const handleApply = () => onApply(sort, Array.from(tags));

  const handleClear = () => {
    setSort("nearby");
    setTags(new Set());
    onClearAll();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Filters"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-[#101514]">Filters</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-100"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <FilterSection title="Sort by">
            <div className="grid grid-cols-2 gap-3">
              {SORT_OPTIONS.map(({ id, label, icon: SortIcon }) => {
                const selected = sort === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSort(id)}
                    className={[
                      "flex h-20 flex-col items-center justify-center gap-1.5 rounded-xl border transition-colors",
                      selected
                        ? "border-2 border-[#3A5A40] bg-[#3A5A40]/[0.08] text-[#3A5A40]"
                        : "border-zinc-200 text-zinc-700 hover:border-zinc-300",
                    ].join(" ")}
                  >
                    <SortIcon
                      size={22}
                      weight={selected ? "fill" : "regular"}
                      color={selected ? ACCENT : "#6B6B6B"}
                    />
                    <span className="text-sm font-semibold">{label}</span>
                  </button>
                );
              })}
            </div>
          </FilterSection>

          <Divider />

          <FilterSection title="Best for">
            <TagWrap
              labels={BEST_FOR_LABELS}
              selected={tags}
              onToggle={toggleTag}
            />
          </FilterSection>

          <Divider />

          <FilterSection title="Amenities">
            <TagWrap
              labels={AMENITY_LABELS}
              selected={tags}
              onToggle={toggleTag}
            />
          </FilterSection>

          <Divider />

          <FilterSection title="Payment accepted">
            <TagWrap
              labels={PAYMENT_LABELS}
              selected={tags}
              onToggle={toggleTag}
            />
          </FilterSection>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 gap-3 border-t border-zinc-200 px-5 py-4">
          <button
            type="button"
            onClick={handleClear}
            className="flex-1 rounded-xl border border-zinc-300 py-3 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-50"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 rounded-xl bg-[#3A5A40] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#31503A]"
          >
            Apply
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
    <section>
      <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-[#848685]">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Divider() {
  return <div className="my-6 h-px bg-zinc-200" />;
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
    <div className="flex flex-wrap gap-2.5">
      {labels.map((label) => {
        const TagIcon = getTagIcon(label);
        const isSelected = selected.has(label);
        return (
          <button
            key={label}
            type="button"
            onClick={() => onToggle(label)}
            className={[
              "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors",
              isSelected
                ? "border-[#3A5A40] bg-[#3A5A40] text-white"
                : "border-[#6b6b6b] text-[#6b6b6b] hover:bg-zinc-50",
            ].join(" ")}
          >
            <TagIcon size={14} weight={isSelected ? "fill" : "regular"} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
