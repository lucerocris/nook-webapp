"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { CaretLeft, CaretRight, Coffee, PushPin, X } from "@phosphor-icons/react";

import type { PublicPhoto } from "@/lib/data/profiles";
import { cn } from "@/lib/utils";

function monthYear(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "Asia/Manila" });
}

/**
 * One gallery photo, large, with what was in the cup and the note
 * (docs/references/public-profile: Lummi's photo-left, caption-right modal;
 * the counter in a top bar as in Aboard; close at the panel's top and
 * previous/next at its foot as in Runway). On phones it fills the screen,
 * dark, the caption under the photo, as in the app's viewer.
 *
 * A native <dialog>: Escape closes, focus stays inside, the page behind is
 * inert. Arrow keys and a sideways swipe move between photos.
 */
export default function PhotoViewer({
  photos,
  index,
  onIndexChange,
}: {
  photos: PublicPhoto[];
  index: number | null;
  onIndexChange: (index: number | null) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const swipeFrom = useRef<number | null>(null);
  const isOpen = index !== null;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
      document.documentElement.style.overflow = "hidden";
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, []);

  const photo = index !== null ? photos[index] : null;
  const count = photos.length;
  const go = (step: number) => {
    if (index === null) return;
    const next = index + step;
    if (next >= 0 && next < count) onIndexChange(next);
  };

  const date = photo ? monthYear(photo.takenAt) : null;

  return (
    <dialog
      ref={ref}
      aria-label={photo ? (photo.drinkName ?? `Photo at ${photo.cafeName}`) : "Photo"}
      onClose={() => {
        document.documentElement.style.overflow = "";
        onIndexChange(null);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(1);
        if (e.key === "ArrowLeft") go(-1);
      }}
      onClick={(e) => {
        // A click on the dimmed backdrop (the dialog box itself) closes it.
        if (e.target === e.currentTarget) ref.current?.close();
      }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-ink p-0 text-white backdrop:bg-black/75 sm:bg-transparent"
    >
      {photo ? (
        <div
          className="flex h-full items-stretch sm:items-center sm:justify-center sm:p-8"
          onClick={(e) => {
            if (e.target === e.currentTarget) ref.current?.close();
          }}
        >
          <div className="flex h-full w-full flex-col sm:grid sm:h-[min(86dvh,760px)] sm:max-w-5xl sm:grid-cols-[minmax(0,1fr)_340px] sm:overflow-hidden sm:rounded-card sm:bg-white sm:text-ink">
            {/* Phone top bar: close, then where you are. */}
            <div className="flex items-center justify-between px-2 pt-[max(env(safe-area-inset-top),8px)] pb-2 sm:hidden">
              <CloseButton onClose={() => ref.current?.close()} tone="dark" />
              <p className="text-sm text-white/70 tabular-nums">
                {index! + 1} of {count}
              </p>
              <span className="size-11" aria-hidden />
            </div>

            <div
              className="relative min-h-0 flex-1 touch-pan-y bg-black"
              onPointerDown={(e) => {
                swipeFrom.current = e.clientX;
              }}
              onPointerUp={(e) => {
                if (swipeFrom.current === null) return;
                const dx = e.clientX - swipeFrom.current;
                swipeFrom.current = null;
                if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
              }}
            >
              <Image
                key={photo.id}
                src={photo.imageUrl}
                alt={[photo.drinkName, `at ${photo.cafeName}`].filter(Boolean).join(" ")}
                fill
                sizes="(min-width: 640px) 640px, 100vw"
                className="object-contain"
                draggable={false}
                priority
              />
            </div>

            <div className="flex max-h-[45dvh] flex-col overflow-y-auto overscroll-contain px-5 pt-4 pb-[max(env(safe-area-inset-bottom),16px)] sm:max-h-none sm:p-6">
              <div className="hidden items-center justify-between sm:flex">
                <p className="text-sm text-muted tabular-nums">
                  {index! + 1} of {count}
                </p>
                <CloseButton onClose={() => ref.current?.close()} tone="light" />
              </div>

              <div className="sm:mt-4">
                {photo.pinned ? (
                  <p className="mb-2 flex w-fit items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white sm:bg-brand-soft sm:text-brand">
                    <PushPin size={11} weight="fill" aria-hidden />
                    Pinned
                  </p>
                ) : null}
                {photo.drinkName ? (
                  <h2 className="text-lg leading-snug font-semibold break-words sm:text-xl sm:text-ink">
                    {photo.drinkName}
                  </h2>
                ) : null}
                {photo.note ? (
                  <p className="mt-1.5 text-[15px] leading-relaxed break-words whitespace-pre-line text-white/85 sm:text-body">
                    {photo.note}
                  </p>
                ) : null}

                <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
                  <Link
                    href={`/cafes/${photo.cafeId}`}
                    className="flex h-10 max-w-full items-center gap-2 rounded-full bg-white/10 pr-3 pl-3.5 text-sm font-medium text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:border sm:border-line-strong sm:bg-white sm:text-ink sm:hover:bg-subtle sm:focus-visible:outline-brand"
                  >
                    <Coffee size={16} aria-hidden className="shrink-0" />
                    <span className="truncate">{photo.cafeName}</span>
                    <CaretRight size={14} aria-hidden className="shrink-0 opacity-70" />
                  </Link>
                  {date ? <p className="text-[13px] text-white/60 sm:text-muted">{date}</p> : null}
                </div>
                {photo.cafeArea ? (
                  <p className="mt-2 text-[13px] text-white/60 sm:text-muted">{photo.cafeArea}</p>
                ) : null}
              </div>

              {count > 1 ? (
                <div className="mt-5 flex gap-2 sm:mt-auto sm:pt-6">
                  <StepButton label="Previous photo" disabled={index === 0} onClick={() => go(-1)}>
                    <CaretLeft size={18} />
                  </StepButton>
                  <StepButton label="Next photo" disabled={index === count - 1} onClick={() => go(1)}>
                    <CaretRight size={18} />
                  </StepButton>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}

function CloseButton({ onClose, tone }: { onClose: () => void; tone: "dark" | "light" }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Close"
      className={cn(
        "flex size-11 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
        tone === "dark"
          ? "text-white hover:bg-white/10 focus-visible:outline-white"
          : "-mr-2 text-ink hover:bg-subtle focus-visible:outline-brand",
      )}
    >
      <X size={20} />
    </button>
  );
}

function StepButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-11 items-center justify-center rounded-full border border-white/25 text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-35 disabled:hover:bg-transparent sm:border-line-strong sm:text-ink sm:hover:bg-subtle sm:focus-visible:outline-brand"
    >
      {children}
    </button>
  );
}
