"use client";

import { useState } from "react";

type CafeResult = {
  id: string;
  name: string;
  description: string | null;
  address: string;
  neighborhood: string | null;
  city: string;
  featured_image_url: string | null;
  rating: number | null;
  review_count: number | null;
  is_new: boolean;
  is_featured: boolean;
  tag_names: string[];
};

export default function Hero({
  onResults,
  onAIResponse,
}: {
  onResults: (cafes: CafeResult[], query: string, mode: "keyword" | "ai" | null) => void;
  onAIResponse?: (response: { response: string; recommendations: Array<{ id: string; name: string; reason: string }> }, query: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  async function searchKeyword() {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      
      if (!url || !key) {
        console.error("Missing Supabase configuration");
        return;
      }

      const response = await fetch(
        `${url}/functions/v1/cafe-search`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            query,
            limit: 12,
            city: "Cebu City",
          }),
        }
      );

      if (!response.ok) {
        console.error("Search failed:", response.statusText);
        return;
      }

      const payload = await response.json();
      onResults(payload.cafes ?? [], query, "keyword");
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function searchAI() {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      
      if (!url || !key) {
        console.error("Missing Supabase configuration");
        return;
      }

      const response = await fetch(
        `${url}/functions/v1/ask-ai`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            message: query,
            city: "Cebu City",
            limit: 8,
          }),
        }
      );

      if (!response.ok) {
        console.error("AI search failed:", response.statusText);
        return;
      }

      const payload = await response.json();
      if (onAIResponse) {
        onAIResponse({
          response: payload.response,
          recommendations: payload.recommendations ?? [],
        }, query);
      }
    } catch (error) {
      console.error("AI search error:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="pt-48 pb-16 sm:pt-64 sm:pb-24">
      <div className="mx-auto w-full max-w-5xl px-6 sm:px-8">
        <div className="relative z-10 flex flex-col items-center text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-[#3b3b3b] sm:text-5xl">
            Philippine cafes, community curated.
          </h1>

          <p className="mt-4 text-lg text-[#3b3b3b]">
            Find the perfect spot to work, study, or chill. Filter by Wi-Fi,
            outlets, and vibe, or ask our AI to find your match.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              searchKeyword();
            }}
            className="mt-6 flex w-full items-center gap-2 rounded-full border border-zinc-200 bg-white p-2"
          >
            <div className="flex flex-1 items-center gap-2 pl-3">
              <span className="flex h-5 w-5 items-center justify-center text-[#3b3b3b]">
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
              <input
                type="text"
                name="q"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search 'Specialty Coffee', 'IT Park', or a cafe name..."
                className="flex-1 bg-transparent text-sm text-[#3b3b3b] placeholder:text-zinc-400 outline-none focus:ring-0"
              />
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => searchAI()}
                disabled={loading}
                className="rounded-full border border-zinc-300 bg-transparent px-4 py-2 text-sm font-medium text-[#3b3b3b] transition-colors hover:bg-zinc-50 disabled:opacity-50"
              >
                {loading ? "..." : "Ask AI"}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-full bg-[#3A5A40] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2f4833] disabled:opacity-50"
              >
                {loading ? "..." : "Search"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}