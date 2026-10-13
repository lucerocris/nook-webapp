"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { CaretLeft, CaretRight, X } from "@phosphor-icons/react";

import { type CupPhotoEntry } from "@/lib/data/cups-mappers";
import { cn } from "@/lib/utils";
import CupAvatar from "./CupAvatar";
import CupKindIcon, { CUP_KIND_LABEL } from "./CupKindIcon";
import RatingStars from "./RatingStars";
import { visitDay } from "./visit-day";

/** "Spanish latte at Hom Cafe, photo by @sai" (SHARE_CUP_STORY §6.2). */
export function cupPhotoAlt(photo: CupPhotoEntry, cafeName: string): string {
  const by = photo.username ? `@${photo.username}` : photo.authorName;
  const what = photo.label ?? (photo.kind ? CUP_KIND_LABEL[photo.kind] : "Photo");
  return `${what} at ${cafeName}, photo by ${by}`;
}

/**
 * One cup photo, large, with the visit it came from: what it is, the cup's
 * stars and day, its note, and who posted it (the profile's PhotoViewer
 * layout — photo left, words right on desktop; full screen and dark on a
 * phone — with the app's credit chip in place of the cafe chip,
 * docs/references/cups). A native <dialog>: Escape closes, focus stays
 * inside; arrow keys and a sideways swipe move between photos.
 */
export default function CupPhotoViewer({
  photos,
  index,
  onIndexChange,
  cafeName,
}: {
  photos: CupPhotoEntry[];
  index: number | null;
  onIndexChange: (index: number | null) => void;
  cafeName: string;
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

  const photo = index !== null ? (photos[index] ?? null) : null;
  const count = photos.length;
  const go = (step: number) => {
    if (index === null) return;
    const next = index + step;
    if (next >= 0 && next < count) onIndexChange(next);
  };
  const close = () => ref.current?.close();
  const day = photo ? visitDay(photo.visitedAt) : "";

  return (
    <dialog
      ref={ref}
      aria-label={photo ? cupPhotoAlt(photo, cafeName) : "Photo"}
      onClose={() => {
        document.documentElement.style.overflow = "";
        onIndexChange(null);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(1);
        if (e.key === "ArrowLeft") go(-1);
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-ink p-0 text-white backdrop:bg-black/75 sm:bg-transparent"
    >
      {photo ? (
        <div
          className="flex h-full items-stretch sm:items-center sm:justify-center sm:p-8"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div className="flex h-full w-full flex-col sm:grid sm:h-[min(86dvh,760px)] sm:max-w-5xl sm:grid-cols-[minmax(0,1fr)_340px] sm:overflow-hidden sm:rounded-card sm:bg-white sm:text-ink">
            <div className="flex items-center justify-between px-2 pt-[max(env(safe-area-inset-top),8px)] pb-2 sm:hidden">
              <CloseButton onClose={close} tone="dark" />
              {count > 1 ? (
                <p className="text-sm text-white/70 tabular-nums">
                  {index! + 1} of {count}
                </p>
              ) : null}
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
                alt={cupPhotoAlt(photo, cafeName)}
                fill
                sizes="(min-width: 640px) 640px, 100vw"
                className="object-contain"
                draggable={false}
              />
            </div>

            <div className="flex max-h-[45dvh] flex-col overflow-y-auto overscroll-contain px-5 pt-4 pb-[max(env(safe-area-inset-bottom),16px)] sm:max-h-none sm:p-6">
              <div className="hidden items-center justify-between sm:flex">
                <p className="text-sm text-muted tabular-nums">
                  {count > 1 ? `${index! + 1} of ${count}` : ""}
                </p>
                <CloseButton onClose={close} tone="light" />
              </div>

              <div className="sm:mt-4">
                {photo.label || photo.kind ? (
                  <h2 className="flex items-start gap-2 text-lg leading-snug font-semibold break-words sm:text-xl sm:text-ink">
                    {photo.kind ? (
                      <CupKindIcon
                        kind={photo.kind}
                        size={18}
                        className="mt-1 shrink-0 text-white/70 sm:text-fern"
                      />
                    ) : null}
                    <span className="min-w-0">{photo.label ?? CUP_KIND_LABEL[photo.kind!]}</span>
                  </h2>
                ) : null}
                <div className="mt-1.5 flex items-center gap-2 text-[13px] text-white/60 sm:text-muted">
                  {photo.rating !== null ? (
                    <>
                      <RatingStars rating={photo.rating} size={13} className="text-white sm:text-ink" />
                      <span className="sr-only">{photo.rating} out of 5.</span>
                    </>
                  ) : null}
                  {day ? <span>{day}</span> : null}
                </div>
                {photo.note ? (
                  <p className="mt-3 text-[15px] leading-relaxed break-words whitespace-pre-line text-white/85 sm:text-body">
                    {photo.note}
                  </p>
                ) : null}

                <div className="mt-4">
                  <Credit photo={photo} />
                </div>
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

/** Who posted it: avatar + name, a link to their profile when they have a
 * handle. */
function Credit({ photo }: { photo: CupPhotoEntry }) {
  const inner = (
    <>
      <CupAvatar name={photo.authorName} url={photo.avatarUrl} size={28} />
      <span className="truncate">{photo.username ? `@${photo.username}` : photo.authorName}</span>
    </>
  );
  const chip =
    "flex h-10 max-w-full w-fit items-center gap-2 rounded-full bg-white/10 pr-3 pl-1.5 text-sm font-medium text-white sm:border sm:border-line-strong sm:bg-white sm:text-ink";
  if (!photo.username) return <p className={chip}>{inner}</p>;
  return (
    <Link
      href={`/u/${photo.username}`}
      className={cn(
        chip,
        "transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:hover:bg-subtle sm:focus-visible:outline-brand",
      )}
    >
      {inner}
      <CaretRight size={14} aria-hidden className="shrink-0 opacity-70" />
    </Link>
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
