"use client";

import { useEffect, useRef } from "react";
import type maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const FALLBACK_STYLE = "https://tiles.openfreemap.org/styles/bright";

type Props = {
  name: string;
  address: string;
  lat: number;
  lng: number;
};

export default function CafeLocationMap({
  name,
  address,
  lat,
  lng,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let map: maplibregl.Map | undefined;
    let cancelled = false;

    const initializeMap = async () => {
      const mod = await import("maplibre-gl");
      const maplibre = (mod.default ?? mod) as typeof import("maplibre-gl");
      if (cancelled || !containerRef.current) return;

      let style: string | maplibregl.StyleSpecification = FALLBACK_STYLE;
      try {
        const response = await fetch("/mapstyle.json");
        if (response.ok) {
          style = (await response.json()) as maplibregl.StyleSpecification;
        }
      } catch {
        // The public OpenFreeMap style remains available as a fallback.
      }

      if (cancelled || !containerRef.current) return;

      map = new maplibre.Map({
        container: containerRef.current,
        style,
        center: [lng, lat],
        zoom: 15.5,
        cooperativeGestures: true,
      });

      const popup = new maplibre.Popup({ offset: 28 }).setText(
        address ? `${name} - ${address}` : name,
      );
      const marker = new maplibre.Marker({ color: "#31533f" })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map);
      marker.getElement().setAttribute("aria-label", `Show ${name} location`);
    };

    void initializeMap();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [address, lat, lng, name]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      role="region"
      aria-label={`Map showing ${name}`}
    />
  );
}
