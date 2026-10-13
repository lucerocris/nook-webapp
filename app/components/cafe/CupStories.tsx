"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CaretLeft, CaretRight, Pause, Play, X } from "@phosphor-icons/react";

import HorizontalScroller from "@/app/components/HorizontalScroller";
import {
  groupCupStories,
  shortVisitAge,
  storyLatest,
  type CupPhotoEntry,
  type CupStory,
} from "@/lib/data/cups-mappers";
import { cn } from "@/lib/utils";
import CupAvatar from "./CupAvatar";
import CupKindIcon, { CUP_KIND_LABEL } from "./CupKindIcon";
import { cupPhotoAlt } from "./CupPhotoViewer";
import RatingStars from "./RatingStars";

const SEEN_KEY = "nook.cupStories.seen";
const SEEN_MAX = 400;
const TURN_MS = 5000;

function readSeen(): Set<string> {
  try {
    const raw = window.localStorage.getItem(SEEN_KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(Array.isArray(list) ? list.filter((x) => typeof x === "string") : []);
  } catch {
    return new Set();
  }
}

function writeSeen(seen: Set<string>) {
  try {
    window.localStorage.setItem(SEEN_KEY, JSON.stringify([...seen].slice(-SEEN_MAX)));
  } catch {
    // Private mode or full storage: rings just stay "new".
  }
}

const isSeen = (story: CupStory, seen: Set<string>) =>
  story.photos.every((p) => seen.has(p.id));

/**
 * "Latest cups": the newest photos people posted at this cafe as a stories
 * tray near the top of its page, one ring per person (newest first) holding
 * their newest cup with their avatar as a badge, then their name and how long
 * ago. A ring opens the story viewer. The app's tray
 * (nook-mobile cafe_community_photos_section.dart; references: Instagram's
 * tray, Google Maps' header). Rings stay green until every photo in them was
 * watched on this device.
 */
export default function CupStories({
  photos,
  cupCount,
  cafeName,
  photosHref,
}: {
  photos: CupPhotoEntry[];
  /** The cafe's cups (visits), for the title. */
  cupCount: number;
  cafeName: string;
  /** Every photo, as a grid. Hidden with fewer than two photos. */
  photosHref: string;
}) {
  const stories = useMemo(() => groupCupStories(photos), [photos]);
  const [seen, setSeen] = useState<Set<string>>(() => new Set());
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    // localStorage only exists in the browser; the server renders every
    // ring as new, and this settles it after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSeen(readSeen());
  }, []);

  const markSeen = useCallback((id: string) => {
    setSeen((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      writeSeen(next);
      return next;
    });
  }, []);

  if (stories.length === 0) return null;

  return (
    <div>
      <HorizontalScroller
        ariaLabel="latest cups"
        gapClass="gap-1"
        bleed
        header={
          <h2 className="text-lg font-semibold tracking-[-0.01em] text-ink">
            Latest cups
            {cupCount > 0 ? (
              <span className="ml-2 font-normal text-muted tabular-nums">{cupCount}</span>
            ) : null}
          </h2>
        }
        actions={
          photos.length > 1 ? (
            <Link
              href={photosHref}
              className="inline-flex min-h-11 items-center gap-0.5 text-sm font-semibold text-ink underline-offset-4 hover:underline"
            >
              Photos
              <CaretRight size={14} aria-hidden />
            </Link>
          ) : null
        }
      >
        {stories.map((story, index) => (
          <StorySlot
            key={story.userId || index}
            story={story}
            seen={isSeen(story, seen)}
            onOpen={() => setOpen(index)}
          />
        ))}
      </HorizontalScroller>

      <StoryViewer
        stories={stories}
        open={open}
        onOpenChange={setOpen}
        seen={seen}
        onSeen={markSeen}
        cafeName={cafeName}
      />
    </div>
  );
}

/** The ring is split into one arc per photo, so "3 photos" shows before
 * you open it (the app's StoryRingPainter). */
function Ring({ segments, seen }: { segments: number; seen: boolean }) {
  const size = 76;
  const stroke = seen ? 1.5 : 2.5;
  const r = (size - 3) / 2;
  const c = 2 * Math.PI * r;
  const n = Math.min(Math.max(segments, 1), 12);
  const gap = n > 1 ? 4 : 0;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn("absolute inset-0 -rotate-90", seen ? "text-line-strong" : "text-brand")}
      aria-hidden
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={n > 1 ? `${c / n - gap} ${gap}` : undefined}
      />
    </svg>
  );
}

function StorySlot({
  story,
  seen,
  onOpen,
}: {
  story: CupStory;
  seen: boolean;
  onOpen: () => void;
}) {
  const latest = storyLatest(story);
  const age = shortVisitAge(latest.visitedAt);
  const name = story.username ? `@${story.username}` : story.authorName;
  const count = story.photos.length;
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${story.authorName}’s ${count === 1 ? "photo" : `${count} photos`}${
        age ? `, ${age}` : ""
      }${seen ? "" : ", new"}. Open`}
      className="group flex w-[88px] shrink-0 snap-start flex-col items-center rounded-xl pt-1 pb-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <span className="relative block size-[76px]">
        <Ring segments={count} seen={seen} />
        <span className="absolute inset-[5px] overflow-hidden rounded-full bg-subtle">
          <Image
            src={latest.imageUrl}
            alt=""
            fill
            sizes="66px"
            className="object-cover transition-opacity duration-150 group-hover:opacity-90"
          />
        </span>
        <span className="absolute -right-0.5 -bottom-0.5 rounded-full bg-white p-0.5">
          <CupAvatar name={story.authorName} url={story.avatarUrl} size={24} />
        </span>
      </span>
      <span
        className={cn(
          "mt-1.5 w-full truncate text-center text-[13px] text-ink",
          seen ? "font-normal" : "font-semibold",
        )}
      >
        {name}
      </span>
      <span suppressHydrationWarning className="w-full truncate text-center text-xs text-muted">
        {age}
      </span>
    </button>
  );
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

/**
 * Full screen, one person at a time (the app's story viewer; references:
 * TikTok's header over the photo with its words under it, Feels' words
 * anchored bottom-left). Segment bars, then who and when with pause and
 * close, the photo, then what it is with the cup's stars and note.
 *
 * Each photo gets five seconds, then the next; the last photo of the last
 * person closes. Holding the photo pauses; tapping its left third goes
 * back, the rest goes on. Arrow keys move, Space pauses, Escape closes.
 * Under reduced motion nothing moves on its own.
 */
function StoryViewer({
  stories,
  open,
  onOpenChange,
  seen,
  onSeen,
  cafeName,
}: {
  stories: CupStory[];
  open: number | null;
  onOpenChange: (index: number | null) => void;
  seen: Set<string>;
  onSeen: (photoId: string) => void;
  cafeName: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const reduced = usePrefersReducedMotion();
  const [person, setPerson] = useState(0);
  const [photo, setPhoto] = useState(0);
  const [paused, setPaused] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const holdTimer = useRef<number | null>(null);
  const held = useRef(false);

  // Opening a ring starts at that person's first unwatched photo.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open !== null) {
      const story = stories[open];
      const firstNew = story ? story.photos.findIndex((p) => !seen.has(p.id)) : 0;
      // Opening is a reset of the viewer to the ring that was tapped.
      /* eslint-disable react-hooks/set-state-in-effect */
      setPerson(open);
      setPhoto(firstNew < 0 ? 0 : firstNew);
      setPaused(false);
      setNoteOpen(false);
      /* eslint-enable react-hooks/set-state-in-effect */
      if (!dialog.open) {
        dialog.showModal();
        document.documentElement.style.overflow = "hidden";
      }
    } else if (dialog.open) {
      dialog.close();
    }
    // `seen` is read once, when the ring opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, stories]);

  useEffect(() => {
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, []);

  const story = open !== null ? stories[person] : null;
  const current = story ? story.photos[Math.min(photo, story.photos.length - 1)] : null;

  const currentId = current?.id ?? null;
  useEffect(() => {
    if (currentId) onSeen(currentId);
  }, [currentId, onSeen]);

  const close = useCallback(() => ref.current?.close(), []);

  const next = useCallback(() => {
    if (!story) return;
    setNoteOpen(false);
    if (photo < story.photos.length - 1) {
      setPhoto(photo + 1);
    } else if (person < stories.length - 1) {
      setPerson(person + 1);
      setPhoto(0);
    } else {
      close();
    }
  }, [story, photo, person, stories.length, close]);

  const prev = useCallback(() => {
    setNoteOpen(false);
    if (photo > 0) {
      setPhoto(photo - 1);
    } else if (person > 0) {
      setPerson(person - 1);
      setPhoto(stories[person - 1].photos.length - 1);
    } else {
      setPhoto(0);
    }
  }, [photo, person, stories]);

  const autoplay = !reduced;
  const running = autoplay && !paused && !noteOpen;

  const onPointerDown = () => {
    held.current = false;
    holdTimer.current = window.setTimeout(() => {
      held.current = true;
      setPaused(true);
    }, 250);
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    if (held.current) {
      held.current = false;
      setPaused(false);
      return;
    }
    const box = e.currentTarget.getBoundingClientRect();
    if (e.clientX - box.left < box.width / 3) prev();
    else next();
  };

  const age = current ? shortVisitAge(current.visitedAt) : "";
  const label = current ? (current.label ?? (current.kind ? CUP_KIND_LABEL[current.kind] : null)) : null;

  return (
    <dialog
      ref={ref}
      aria-label={story ? `Cups by ${story.authorName}` : "Cups"}
      onClose={() => {
        document.documentElement.style.overflow = "";
        onOpenChange(null);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") next();
        if (e.key === "ArrowLeft") prev();
        if (e.key === " " && (e.target as HTMLElement).tagName !== "BUTTON") {
          e.preventDefault();
          setPaused((p) => !p);
        }
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-black p-0 text-white backdrop:bg-black/90"
    >
      {story && current ? (
        <div
          className="flex h-full items-center justify-center sm:gap-4 sm:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <SideButton label="Previous" onClick={prev} disabled={person === 0 && photo === 0}>
            <CaretLeft size={20} />
          </SideButton>

          <div className="relative flex h-full w-full flex-col bg-black sm:h-[min(92dvh,860px)] sm:w-auto sm:aspect-[9/16] sm:overflow-hidden sm:rounded-card">
            {/* Segment bars: one per photo of this person. */}
            <div className="flex gap-1 px-3 pt-[max(env(safe-area-inset-top),10px)]" aria-hidden>
              {story.photos.map((p, i) => (
                <span key={p.id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
                  {i < photo || (i === photo && !autoplay) ? (
                    <span className="block h-full w-full bg-white" />
                  ) : i === photo ? (
                    <span
                      key={`${person}-${photo}`}
                      className="cup-story-fill block h-full w-full bg-white"
                      style={
                        {
                          "--cup-story-duration": `${TURN_MS}ms`,
                          animationPlayState: running ? "running" : "paused",
                        } as React.CSSProperties
                      }
                      onAnimationEnd={next}
                    />
                  ) : null}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-3 px-3 pt-3 pb-2">
              {story.username ? (
                <Link
                  href={`/u/${story.username}`}
                  className="flex min-h-11 min-w-0 items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <CupAvatar name={story.authorName} url={story.avatarUrl} size={32} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">@{story.username}</span>
                    {age ? <span className="block text-xs text-white/70">{age}</span> : null}
                  </span>
                </Link>
              ) : (
                <span className="flex min-h-11 min-w-0 items-center gap-2.5">
                  <CupAvatar name={story.authorName} url={story.avatarUrl} size={32} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{story.authorName}</span>
                    {age ? <span className="block text-xs text-white/70">{age}</span> : null}
                  </span>
                </span>
              )}
              <span className="flex-1" />
              {autoplay ? (
                <IconButton label={paused ? "Play" : "Pause"} onClick={() => setPaused((p) => !p)}>
                  {paused ? <Play size={18} weight="fill" /> : <Pause size={18} weight="fill" />}
                </IconButton>
              ) : null}
              <IconButton label="Close" onClick={close}>
                <X size={20} />
              </IconButton>
            </div>

            <div
              className="relative min-h-0 flex-1 touch-pan-y select-none"
              onPointerDown={onPointerDown}
              onPointerUp={onPointerUp}
              onPointerCancel={() => {
                if (holdTimer.current) window.clearTimeout(holdTimer.current);
                setPaused(false);
              }}
              onContextMenu={(e) => e.preventDefault()}
            >
              <Image
                key={current.id}
                src={current.imageUrl}
                alt={cupPhotoAlt(current, cafeName)}
                fill
                sizes="(min-width: 640px) 480px, 100vw"
                className="object-contain"
                draggable={false}
                priority
              />
            </div>

            <div
              className={cn(
                "px-4 pt-3 pb-[max(env(safe-area-inset-bottom),16px)] transition-opacity duration-150",
                paused && autoplay && !noteOpen && "opacity-0",
              )}
            >
              {label ? (
                <p className="flex items-center gap-1.5 text-base font-semibold">
                  {current.kind ? (
                    <CupKindIcon kind={current.kind} size={16} className="shrink-0 text-white/80" />
                  ) : null}
                  <span className="min-w-0 truncate">{label}</span>
                </p>
              ) : null}
              {current.rating !== null ? (
                <p className="mt-1 flex items-center gap-2">
                  <RatingStars rating={current.rating} size={13} className="text-white" />
                  <span className="sr-only">{current.rating} out of 5.</span>
                </p>
              ) : null}
              {current.note ? (
                <button
                  type="button"
                  onClick={() => setNoteOpen((v) => !v)}
                  aria-expanded={noteOpen}
                  className={cn(
                    "mt-2 block w-full text-left text-[15px] leading-6 break-words whitespace-pre-line text-white/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
                    noteOpen ? "max-h-[40dvh] overflow-y-auto overscroll-contain" : "line-clamp-3",
                  )}
                >
                  {current.note}
                </button>
              ) : null}
            </div>
          </div>

          <SideButton
            label="Next"
            onClick={next}
            disabled={false}
          >
            <CaretRight size={20} />
          </SideButton>
        </div>
      ) : null}
    </dialog>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex size-11 shrink-0 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
    >
      {children}
    </button>
  );
}

/** Desktop only: previous / next beside the story; phones tap the photo. */
function SideButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="hidden size-11 shrink-0 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-30 sm:flex"
    >
      {children}
    </button>
  );
}
