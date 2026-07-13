"use client";

import { useState } from "react";
import { X } from "@phosphor-icons/react/dist/ssr";
import Hero from "./components/Hero";
import CafeRow from "./components/CafeRow";
import CafeCard from "./components/CafeCard";
import AIRecommendationsSection from "./components/AIRecommendationsSection";

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

type SearchMode = "keyword" | "ai" | null;

export default function Home() {
  const [results, setResults] = useState<CafeResult[]>([]);
  const [aiResponse, setAIResponse] = useState<{ response: string; recommendations: Array<{ id: string; name: string; reason: string }> } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState<SearchMode>(null);

  const handleClearSearch = () => {
    setResults([]);
    setAIResponse(null);
    setSearchQuery("");
    setSearchMode(null);
  };

  const handleResults = (
    cafes: CafeResult[],
    query: string,
    mode: SearchMode
  ) => {
    setResults(cafes);
    setAIResponse(null);
    setSearchQuery(query);
    setSearchMode(mode);
  };

  const handleAIResponse = (
    response: { response: string; recommendations: Array<{ id: string; name: string; reason: string }> },
    query: string
  ) => {
    setAIResponse(response);
    setResults([]);
    setSearchQuery(query);
    setSearchMode("ai");
  };

  const hasSearchResults = results.length > 0 || aiResponse;

  return (
    <main className="flex-1">
      <Hero onResults={handleResults} onAIResponse={handleAIResponse} />

      {hasSearchResults ? (
        <>
          {/* Search Header */}
          <div className="border-b border-zinc-200 bg-zinc-50">
            <div className="mx-auto w-full max-w-7xl px-6 sm:px-8 py-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-[#3b3b3b]">
                    {searchMode === "ai" ? "AI Recommendations" : "Search Results"}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-600">
                    {searchMode === "ai" 
                      ? `Based on: "${searchQuery}"`
                      : `Found ${results.length} cafe${results.length !== 1 ? "s" : ""} for "${searchQuery}"`
                    }
                  </p>
                </div>
                <button
                  onClick={handleClearSearch}
                  className="flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-[#3b3b3b] transition-colors hover:bg-zinc-50 active:bg-zinc-100"
                  aria-label="Clear search"
                >
                  <X size={18} weight="bold" />
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* AI Recommendations */}
          {aiResponse && (
            <AIRecommendationsSection response={aiResponse} cafes={results} />
          )}

          {/* Keyword Search Results */}
          {results.length > 0 && searchMode !== "ai" && (
            <section className="py-8 sm:py-10">
              <div className="mx-auto w-full max-w-7xl px-6 sm:px-8">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {results.map((cafe) => (
                    <CafeCard key={cafe.id} cafe={cafe} />
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      ) : (
        <>
          <CafeRow title="Featured" />
          <CafeRow title="New" />
          <CafeRow title="Trending" />
        </>
      )}
    </main>
  );
}