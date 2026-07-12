"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MapPin } from "@phosphor-icons/react";

export default function NearbyOptIn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (searchParams.get("lat") && searchParams.get("lng")) {
    return null;
  }

  function handleClick() {
    setError(null);
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Geolocation is not supported in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("lat", position.coords.latitude.toFixed(6));
        params.set("lng", position.coords.longitude.toFixed(6));
        startTransition(() => {
          router.push(`/?${params.toString()}`);
        });
      },
      (geoError) => {
        setError(geoError.message || "Could not read your location.");
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-6 pt-2 sm:px-8">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-[#3b3b3b] transition-colors hover:bg-zinc-50 disabled:opacity-60"
      >
        <MapPin size={16} className="text-[#3A5A40]" />
        {pending ? "Finding nearby cafes…" : "Use my location for nearby cafes"}
      </button>
      {error ? (
        <p className="mt-2 text-xs text-red-500">{error}</p>
      ) : null}
    </div>
  );
}
