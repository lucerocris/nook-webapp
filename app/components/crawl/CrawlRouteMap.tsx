"use client";

import { useEffect, useRef } from "react";
import type maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const FALLBACK_STYLE = "https://tiles.openfreemap.org/styles/bright";
const ROUTE_SOURCE = "crawl-route";
// Tokens from globals.css; maplibre paints on a canvas and cannot read CSS
// variables.
const BRAND = "#3a5a40";

export type RoutePoint = { order: number; name: string; lat: number; lng: number };

/**
 * The crawl on a map (PamPam's route map: the list's number repeats on each
 * pin, joined in visiting order; docs/references/crawl-link). The line is
 * straight from stop to stop: it shows the order, not a walking path.
 */
export default function CrawlRouteMap({ points, title }: { points: RoutePoint[]; title: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const key = points.map((p) => `${p.order}:${p.lat},${p.lng}`).join("|");

  useEffect(() => {
    if (!containerRef.current || points.length === 0) return;
    let map: maplibregl.Map | undefined;
    let cancelled = false;

    const init = async () => {
      const mod = await import("maplibre-gl");
      const maplibre = (mod.default ?? mod) as typeof import("maplibre-gl");
      if (cancelled || !containerRef.current) return;

      let style: string | maplibregl.StyleSpecification = FALLBACK_STYLE;
      try {
        const res = await fetch("/mapstyle.json");
        if (res.ok) style = (await res.json()) as maplibregl.StyleSpecification;
      } catch {
        // The public OpenFreeMap style is the fallback.
      }
      if (cancelled || !containerRef.current) return;

      const bounds = new maplibre.LngLatBounds();
      for (const p of points) bounds.extend([p.lng, p.lat]);

      map = new maplibre.Map({
        container: containerRef.current,
        style,
        bounds,
        // More room at the bottom: the attribution button sits there.
        fitBoundsOptions: { padding: { top: 48, right: 64, bottom: 64, left: 48 }, maxZoom: 15 },
        cooperativeGestures: true,
        attributionControl: { compact: true },
      });
      map.addControl(new maplibre.NavigationControl({ showCompass: false }), "top-right");

      map.on("load", () => {
        // The compact attribution opens expanded and covers the lowest pins
        // on a phone; start it folded to its (i) button.
        containerRef.current
          ?.querySelector(".maplibregl-ctrl-attrib.maplibregl-compact-show")
          ?.classList.remove("maplibregl-compact-show");
        if (!map || points.length < 2) return;
        map.addSource(ROUTE_SOURCE, {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: points.map((p) => [p.lng, p.lat]) },
          },
        });
        map.addLayer({
          id: ROUTE_SOURCE,
          type: "line",
          source: ROUTE_SOURCE,
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": BRAND, "line-width": 3, "line-dasharray": [1.5, 1.5], "line-opacity": 0.85 },
        });
      });

      for (const p of points) {
        const el = document.createElement("div");
        el.textContent = String(p.order);
        el.setAttribute("aria-label", `Stop ${p.order}: ${p.name}`);
        el.setAttribute("role", "img");
        Object.assign(el.style, {
          width: "30px",
          height: "30px",
          borderRadius: "999px",
          background: BRAND,
          color: "white",
          border: "2px solid white",
          boxShadow: "0 2px 8px rgba(15, 35, 20, 0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          font: "600 13px var(--font-poppins), ui-sans-serif, system-ui, sans-serif",
          fontVariantNumeric: "tabular-nums",
        });
        new maplibre.Marker({ element: el })
          .setLngLat([p.lng, p.lat])
          .setPopup(new maplibre.Popup({ offset: 20, closeButton: false }).setText(`${p.order}. ${p.name}`))
          .addTo(map);
      }
    };

    void init();
    return () => {
      cancelled = true;
      map?.remove();
    };
    // `key` stands in for `points`: a new array with the same stops must not
    // rebuild the map.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      role="region"
      aria-label={`Map of the ${title} route`}
    />
  );
}
