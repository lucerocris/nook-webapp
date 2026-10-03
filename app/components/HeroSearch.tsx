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
import { MagnifyingGlass, Sparkle, X } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";

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
  const isNav = variant === "nav";
  const placeholder =
    variant === "nav"
      ? "Search cafes, tags, or areas..."
      : "Try “quiet cafe with outlets in IT Park”";

  return (
    <div
      ref={containerRef}
      className="relative w-full"
    >
      <form
        onSubmit={handleSubmit}
        /* The input suppresses its own outline, so the visible focus
           indicator lives on this wrapper via :focus-within (WCAG 2.4.7).
           One row at every width: below `sm` the two actions shrink to icon
           buttons instead of stacking, so the field keeps most of the pill. */
        className={cn(
          "flex w-full items-center gap-1.5 rounded-full border bg-white transition-shadow focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/15",
          /* Hero: the page's one loud moment (design.md), so it alone carries
             the soft shadow; the submit is a green pill inside its right end. */
          isNav
            ? "h-11 border-line-strong pl-4 pr-1"
            : "h-14 border-line pl-5 pr-1.5 shadow-raise sm:h-16 sm:pr-2",
        )}
        role="search"
      >
        <MagnifyingGlass
          size={isNav ? 16 : 20}
          className="shrink-0 text-muted"
          aria-hidden
        />

        <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto">
          {selectedTags.map((tag) => (
            <span
              key={tag}
              className="flex shrink-0 items-center gap-1 rounded-full bg-brand-soft py-1 pl-2.5 pr-1 text-xs font-medium text-brand"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                aria-label={`Remove ${tag}`}
                className="flex size-4 items-center justify-center rounded-full transition-colors hover:bg-brand/15"
              >
                <X size={10} weight="bold" />
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
            /* 16px below `sm`: iOS Safari zooms the viewport when a focused
               input is smaller. */
            className="h-full min-w-[6rem] flex-1 bg-transparent text-base text-ink outline-none placeholder:text-muted focus:ring-0 sm:text-[15px]"
            autoComplete="off"
            role="combobox"
            aria-expanded={showPanel}
            aria-controls={listboxId}
            aria-autocomplete="list"
          />
        </div>

        {!isNav ? (
          <button
            type="button"
            onClick={() => {
              setAiSeed(q);
              setAskAiOpen(true);
              setOpen(false);
            }}
            aria-expanded={askAiOpen}
            aria-label="Ask AI"
            className="flex size-11 shrink-0 items-center justify-center gap-1.5 rounded-full text-sm font-medium text-ink transition-colors hover:bg-paper focus-visible:outline-2 focus-visible:outline-brand sm:h-12 sm:w-auto sm:px-4"
          >
            <Sparkle size={18} weight="fill" className="text-brand" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>
        ) : null}
        <button
          type="submit"
          aria-label="Search"
          className={cn(
            "flex shrink-0 items-center justify-center bg-brand text-sm font-medium text-white transition-colors hover:bg-brand-hover focus-visible:bg-brand-hover",
            isNav ? "size-9 rounded-full" : "size-11 rounded-full sm:h-12 sm:w-auto sm:px-6",
          )}
        >
          <MagnifyingGlass size={18} weight="bold" className={isNav ? "" : "sm:hidden"} />
          {!isNav ? <span className="hidden sm:inline">Search</span> : null}
        </button>
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
