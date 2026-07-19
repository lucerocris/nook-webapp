"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
} from "react";
import { X } from "@phosphor-icons/react";

import AskAIPanel from "./AskAIPanel";
import SearchDropdown, { type SearchTab } from "./SearchDropdown";
import type { CafeSummary } from "@/lib/data/cafes-mappers";
import type { SearchTags } from "@/lib/data/search";

type Props = {
  tags: SearchTags;
  initialCafes?: CafeSummary[];
  variant?: "hero" | "nav";
};

const RESULT_LIMIT = 24;

export default function HeroSearch({
  tags,
  initialCafes = [],
  variant = "hero",
}: Props) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SearchTab>("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [cafes, setCafes] = useState<CafeSummary[]>(initialCafes);
  const [searchFailed, setSearchFailed] = useState(false);
  const [askAiOpen, setAskAiOpen] = useState(false);
  // Snapshot of the query at the moment Ask AI opened, so the panel can seed
  // its first question without re-firing as the user keeps typing.
  const [aiSeed, setAiSeed] = useState("");
  const [, startTransition] = useTransition();
  const deferredQ = useDeferredValue(q);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listboxId = useId();

  const tagsKey = selectedTags.join(",");

  useEffect(() => {
    const trimmed = deferredQ.trim();
    const params = new URLSearchParams();
    if (trimmed) params.set("q", trimmed);
    if (tagsKey) params.set("tags", tagsKey);
    params.set("limit", String(RESULT_LIMIT));
    const url = `/api/search/cafes?${params.toString()}`;

    const controller = new AbortController();
    startTransition(() => {
      fetch(url, { signal: controller.signal })
        .then((res) => (res.ok ? res.json() : Promise.reject(res)))
        .then((data: { cafes: CafeSummary[] }) => {
          setCafes(data.cafes);
          setSearchFailed(false);
        })
        .catch((err) => {
          if (err?.name !== "AbortError") {
            // Distinguish failure from genuine emptiness: clearing results
            // alone made the dropdown confidently say "no cafes match your
            // search" whenever the backend was down.
            console.error("[search] request failed", err);
            setCafes([]);
            setSearchFailed(true);
          }
        });
    });

    return () => controller.abort();
  }, [deferredQ, tagsKey, startTransition]);

  useEffect(() => {
    if (!open && !askAiOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setAskAiOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setAskAiOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, askAiOpen]);

  const toggleTag = useCallback((name: string) => {
    setSelectedTags((prev) =>
      prev.includes(name)
        ? prev.filter((t) => t !== name)
        : [...prev, name],
    );
  }, []);

  const removeTag = useCallback((name: string) => {
    setSelectedTags((prev) => prev.filter((t) => t !== name));
  }, []);

  const submit = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      setOpen(false);
      const params = new URLSearchParams();
      if (trimmed) params.set("q", trimmed);
      if (selectedTags.length > 0) params.set("tags", selectedTags.join(","));
      const qs = params.toString();
      router.push(qs ? `/map?${qs}` : "/map");
    },
    [router, selectedTags],
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submit(q);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && q.length === 0 && selectedTags.length > 0) {
      setSelectedTags((prev) => prev.slice(0, -1));
    }
  };

  // The AI panel and the search dropdown occupy the same slot — never both.
  const showPanel = open && !askAiOpen;
  const placeholder =
    variant === "nav"
      ? "Search cafes, tags, or areas..."
      : "Search 'Specialty Coffee', 'IT Park', or a cafe name...";

  return (
    <div
      ref={containerRef}
      className={variant === "nav" ? "relative w-full" : "relative mt-6 w-full"}
    >
      <form
        onSubmit={handleSubmit}
        /* The input suppresses its own outline for the pill look, so the visible
           focus indicator lives on this wrapper via :focus-within — without it
           the app's primary control had no focus state at all (WCAG 2.4.7). */
        className="flex w-full items-center gap-2 rounded-full border border-zinc-200 bg-white p-2 transition-shadow focus-within:border-[#3A5A40] focus-within:ring-2 focus-within:ring-[#3A5A40]/40"
        role="search"
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 pl-3">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center text-[#3b3b3b]">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <circle
                cx="9"
                cy="9"
                r="6.25"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <line
                x1="13.5"
                y1="13.5"
                x2="17.5"
                y2="17.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </span>

          {selectedTags.map((tag) => (
            <span
              key={tag}
              className="flex shrink-0 items-center gap-1 rounded-full bg-[#e3ebe4] py-1 pl-3 pr-1.5 text-sm font-medium text-[#3A5A40]"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                aria-label={`Remove ${tag}`}
                className="flex h-4 w-4 items-center justify-center rounded-full text-[#3A5A40] transition-colors hover:bg-[#3A5A40]/15"
              >
                <X size={12} weight="bold" />
              </button>
            </span>
          ))}

          <input
            ref={inputRef}
            type="text"
            name="q"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
              setActiveTab("all");
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={selectedTags.length > 0 ? "Add more..." : placeholder}
            className="min-w-[8rem] flex-1 bg-transparent text-sm text-[#3b3b3b] placeholder:text-zinc-400 outline-none focus:ring-0"
            autoComplete="off"
            role="combobox"
            aria-expanded={showPanel}
            aria-controls={listboxId}
            aria-autocomplete="list"
          />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {variant === "hero" ? (
            <button
              type="button"
              onClick={() => {
                setAiSeed(q);
                setAskAiOpen(true);
                setOpen(false);
              }}
              aria-expanded={askAiOpen}
              className="rounded-full border border-zinc-300 bg-transparent px-4 py-2 text-sm font-medium text-[#3b3b3b] transition-colors hover:bg-zinc-50"
            >
              Ask AI
            </button>
          ) : null}
          <button
            type="submit"
            className="rounded-full bg-[#3A5A40] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2f4833]"
          >
            Search
          </button>
        </div>
      </form>

      {askAiOpen ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-2">
          <AskAIPanel
            initialQuery={aiSeed}
            onClose={() => setAskAiOpen(false)}
          />
        </div>
      ) : null}

      {showPanel ? (
        <div
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-2"
        >
          <SearchDropdown
            q={q}
            tags={tags}
            cafes={cafes}
            cafesLoading={deferredQ !== q}
            cafesFailed={searchFailed}
            activeTab={activeTab}
            selectedTags={selectedTags}
            onToggleTag={toggleTag}
            onTabChange={setActiveTab}
            onSelect={() => setOpen(false)}
          />
        </div>
      ) : null}
    </div>
  );
}
