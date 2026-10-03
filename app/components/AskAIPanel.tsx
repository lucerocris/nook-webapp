"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, Sparkle } from "@phosphor-icons/react";

import LoadingDots from "./LoadingDots";
import type { AiRecommendation } from "@/lib/data/ai-search";

type ChatTurn = {
  role: "user" | "assistant";
  content: string;
  recommendations?: AiRecommendation[];
};

type Props = {
  /** Seeds the first question when the user already typed something. */
  initialQuery?: string;
  onClose?: () => void;
};

const SUGGESTIONS = [
  "Quiet spot to work with fast wifi",
  "Where can I study late at night?",
  "Cozy cafe for a first date",
  "Good matcha near IT Park",
];

function RecommendationCard({ rec }: { rec: AiRecommendation }) {
  const { cafe, reason } = rec;
  return (
    <Link
      href={`/cafes/${cafe.id}`}
      className="flex gap-3 rounded-xl border border-line bg-white p-3 transition-colors hover:border-brand/40"
    >
      <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-brand-soft">
        {cafe.coverImage ? (
          <Image
            src={cafe.coverImage}
            alt=""
            fill
            sizes="64px"
            className="object-cover"
          />
        ) : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-semibold text-ink">
            {cafe.name}
          </span>
          {cafe.rating > 0 ? (
            <span className="shrink-0 text-xs text-muted">
              ★ {cafe.rating.toFixed(1)}
            </span>
          ) : null}
        </span>
        {cafe.neighborhood ? (
          <span className="mt-0.5 block truncate text-xs text-muted">
            {cafe.neighborhood}
          </span>
        ) : null}
        <span className="mt-1.5 block text-xs leading-relaxed text-body">
          {reason}
        </span>
      </span>
    </Link>
  );
}

export default function AskAIPanel({ initialQuery = "", onClose }: Props) {
  const seed = initialQuery.trim();
  const [input, setInput] = useState("");
  // The seeded question is rendered from the very first paint, so the mount
  // effect below only has to run the network call — no setState in its body.
  const [turns, setTurns] = useState<ChatTurn[]>(() =>
    seed ? [{ role: "user", content: seed }] : [],
  );
  const [pending, setPending] = useState(() => Boolean(seed));
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  // Guards the seeded request so it fires at most once per mount.
  const seededRef = useRef(false);

  /** Network half of a turn: every setState here lands in an async
   * continuation, never synchronously during render or an effect body. */
  const requestAnswer = useCallback(
    async (message: string, history: { role: string; content: string }[]) => {
      try {
        const res = await fetch("/api/ask-ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, conversation: history.slice(-8) }),
        });
        if (!res.ok) throw new Error(String(res.status));

        const data = (await res.json()) as {
          response: string;
          recommendations: AiRecommendation[];
        };
        setTurns((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.response,
            recommendations: data.recommendations,
          },
        ]);
      } catch {
        setError("Couldn't reach the cafe assistant. Please try again.");
      } finally {
        setPending(false);
      }
    },
    [],
  );

  const send = useCallback(
    (raw: string) => {
      const message = raw.trim();
      if (!message || pending) return;

      // History is everything *before* this turn; the API caps its length.
      const history = turns.map(({ role, content }) => ({ role, content }));

      setTurns((prev) => [...prev, { role: "user", content: message }]);
      setInput("");
      setError(null);
      setPending(true);
      void requestAnswer(message, history);
    },
    [pending, turns, requestAnswer],
  );

  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;
    // Fetch-on-mount for the seeded question. Every setState inside
    // requestAnswer runs in an async continuation after the await, not
    // synchronously in this effect body, so no cascading render occurs — the
    // rule can't see through the call boundary.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (seed) void requestAnswer(seed, []);
    else inputRef.current?.focus();
  }, [seed, requestAnswer]);

  // Keep the newest turn in view as the conversation grows.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [turns, pending]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const isEmpty = turns.length === 0 && !pending;

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_12px_28px_rgba(0,0,0,0.08)]">
      <div className="flex items-center gap-2 border-b border-subtle px-4 py-3">
        <Sparkle size={16} weight="fill" className="text-brand" />
        <span className="text-sm font-semibold text-ink">
          Ask Nook AI
        </span>
        <span className="ml-auto text-xs text-muted">
          Recommends only real cafes on Nook
        </span>
      </div>

      <div ref={scrollRef} className="max-h-[26rem] overflow-y-auto px-4 py-3">
        {isEmpty ? (
          <div className="py-2">
            <p className="text-sm text-body">
              Describe the cafe you&apos;re after — vibe, budget, what you need
              it for.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-body transition-colors hover:border-brand/40 hover:bg-brand-soft/50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-4">
          {turns.map((turn, i) =>
            turn.role === "user" ? (
              <div key={i} className="flex justify-end">
                <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-brand px-3.5 py-2 text-sm text-white">
                  {turn.content}
                </p>
              </div>
            ) : (
              <div key={i} className="flex flex-col gap-2.5">
                <p className="text-sm leading-relaxed text-body">
                  {turn.content}
                </p>
                {turn.recommendations && turn.recommendations.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {turn.recommendations.map((rec) => (
                      <RecommendationCard key={rec.cafe.id} rec={rec} />
                    ))}
                  </div>
                ) : null}
              </div>
            ),
          )}

          {pending ? (
            <LoadingDots className="text-brand" label="Thinking" />
          ) : null}

          {error ? (
            <p role="alert" className="text-sm text-closed">
              {error}
            </p>
          ) : null}
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 border-t border-subtle p-3"
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={500}
          placeholder="Ask about any cafe in Cebu..."
          aria-label="Ask the cafe assistant"
          className="min-w-0 flex-1 rounded-full border border-line px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-brand placeholder:text-muted"
        />
        <button
          type="submit"
          disabled={pending || input.trim().length === 0}
          aria-label="Send"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowUp size={16} weight="bold" />
        </button>
      </form>
    </div>
  );
}
