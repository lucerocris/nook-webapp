"use client";

import { useEffect, useRef } from "react";
import type maplibregl from "maplibre-gl";
import type { FeatureCollection, Point } from "geojson";
import "maplibre-gl/dist/maplibre-gl.css";

import type { CafeSummary } from "@/lib/data/cafes-mappers";
import { hasValidCoordinates, type MapViewport } from "@/lib/utils/maps";

const PILL_LAYER_ID = "cafe-pills";
const PILL_HOVER_LAYER_ID = "cafe-pills-hover";
const DOT_LAYER_ID = "cafe-dots";
const COFFEE_LAYER_ID = "cafe-coffee-hover";
const SOURCE_ID = "cafes";
const FALLBACK_STYLE = "https://tiles.openfreemap.org/styles/bright";

const DEFAULT_CENTER: [number, number] = [123.8907, 10.3167]; // Cebu
const DEFAULT_ZOOM = 12;

const PILL_SIZE_DEFAULT = 1.0;
const PILL_SIZE_HOVER = 1.16;
const PILL_SIZE_SELECTED = 1.15;
const DOT_RADIUS_PX = 6; // 12px diameter
const DOT_RADIUS_HOVER_PX = 8;

// How long the hover fade / grow transitions run. Applied to the paint
// properties (opacity, circle-radius) so feature-state hover changes ease
// in and out instead of snapping.
const HOVER_TRANSITION_MS = 180;

// Pin styling — a rounded "pill" badge with a star, rating text, and a
// pointer tail, similar to price/rating markers you see on Google Maps.
const PILL_COLOR = "#2D6A4F";
const PILL_BORDER_COLOR = "#FFFFFF";
const PILL_TEXT_COLOR = "#FFFFFF";
const PILL_CANVAS_SCALE = 3; // supersample for crisp rendering on retina

const COFFEE_ICON_ID = "coffee-pin";
// Phosphor "Coffee" (regular weight) glyph path, viewBox 0 0 256 256.
const COFFEE_ICON_PATH =
  "M80,56V24a8,8,0,0,1,16,0V56a8,8,0,0,1-16,0Zm40,8a8,8,0,0,0,8-8V24a8,8,0,0,0-16,0V56A8,8,0,0,0,120,64Zm32,0a8,8,0,0,0,8-8V24a8,8,0,0,0-16,0V56A8,8,0,0,0,152,64Zm96,56v8a40,40,0,0,1-37.51,39.91,96.59,96.59,0,0,1-27,40.09H208a8,8,0,0,1,0,16H32a8,8,0,0,1,0-16H56.54A96.3,96.3,0,0,1,24,136V88a8,8,0,0,1,8-8H208A40,40,0,0,1,248,120ZM200,96H40v40a80.27,80.27,0,0,0,45.12,72h69.76A80.27,80.27,0,0,0,200,136Zm32,24a24,24,0,0,0-16-22.62V136a95.78,95.78,0,0,1-1.2,15A24,24,0,0,0,232,128Z";
// Phosphor glyph paths (viewBox 0 0 256 256) — used only in the click-popup
// card's inline SVGs, not on the canvas-drawn pills.
const STAR_FILL_PATH =
  "M234.29,114.85l-45,38.83L203,211.75a16.4,16.4,0,0,1-24.5,17.82L128,198.49,77.47,229.57A16.4,16.4,0,0,1,53,211.75l13.76-58.07-45-38.83A16.46,16.46,0,0,1,31.08,86l59-4.76,22.76-55.08a16.36,16.36,0,0,1,30.27,0l22.75,55.08,59,4.76a16.46,16.46,0,0,1,9.37,28.86Z";

type Props = {
  cafes: CafeSummary[];
  selectedCafeId?: string | null;
  onSelectCafe?: (id: string | null) => void;
  initialCenter?: { lat: number; lng: number } | null;
  initialZoom?: number;
  onViewportChange?: (viewport: MapViewport) => void;
  /** Recenters the map once resolved (e.g. after an async geolocation lookup).
   * Queued if it arrives before the map finishes loading. */
  flyToPoint?: { lat: number; lng: number } | null;
};

const FLY_TO_ZOOM = 13;

export default function CafeMap({
  cafes,
  selectedCafeId,
  onSelectCafe,
  initialCenter,
  initialZoom = DEFAULT_ZOOM,
  onViewportChange,
  flyToPoint,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const selectedIdRef = useRef(selectedCafeId);
  const skipNextMoveEndRef = useRef(false);
  const emitAfterInitialMoveRef = useRef(false);
  const registeredPillIdsRef = useRef<Set<string>>(new Set());
  const mapLoadedRef = useRef(false);
  const pendingFocusRef = useRef<{ lat: number; lng: number } | null>(null);
  const cafesRef = useRef(cafes);
  const hoveredFeatureIdRef = useRef<string | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const selectedFeatureIdRef = useRef<string | null>(null);

  useEffect(() => {
    selectedIdRef.current = selectedCafeId;
  }, [selectedCafeId]);

  useEffect(() => {
    if (!containerRef.current) return;
    let destroyed = false;

    const init = async () => {
      const mod = await import("maplibre-gl");
      const maplibregl = (mod.default ?? mod) as typeof import("maplibre-gl");
      if (destroyed) return;

      let style: string | object = FALLBACK_STYLE;
      try {
        const res = await fetch("/mapstyle.json");
        if (res.ok) {
          style = await res.json();
        }
      } catch {
        // leave fallback style
      }
      if (destroyed) return;

      const validCafes = cafes.filter((c) =>
        hasValidCoordinates(c.lat, c.lng),
      );

      const center = (() => {
        if (initialCenter?.lng != null && initialCenter?.lat != null) {
          return [initialCenter.lng, initialCenter.lat] as [number, number];
        }
        const selected = validCafes.find((c) => c.id === selectedCafeId);
        if (selected?.lng != null && selected?.lat != null) {
          return [selected.lng, selected.lat] as [number, number];
        }
        if (
          validCafes.length > 0 &&
          validCafes[0].lng != null &&
          validCafes[0].lat != null
        ) {
          return [validCafes[0].lng, validCafes[0].lat] as [number, number];
        }
        return DEFAULT_CENTER;
      })();

      const map = new maplibregl.Map({
        container: containerRef.current!,
        style: style as string | maplibregl.StyleSpecification,
        center,
        zoom: initialZoom,
      });
      mapRef.current = map;

      map.on("load", () => {
        if (destroyed) return;

        const geojson = buildCafeGeoJSON(validCafes);
        registerPillImages(map, validCafes, registeredPillIdsRef.current);

        map.addSource(SOURCE_ID, {
          type: "geojson",
          data: geojson,
          // Without this, MapLibre's internal GeoJSON→vector-tile step
          // assigns its own numeric feature ids and drops ours, so
          // setFeatureState({id: cafe.id}, ...) would target the wrong
          // (or no) feature. This promotes properties.id to be the real id.
          promoteId: "id",
        });

        addDotLayer(map);
        addPillLayer(map, selectedCafeId);
        addPillHoverLayer(map);
        addCoffeeHoverLayer(map);

        // Register the hover-only coffee pin image once the icon is
        // rasterized; the map redraws automatically when it lands.
        void buildCoffeePinCanvas()
          .then((canvas) => {
            if (destroyed || map.hasImage(COFFEE_ICON_ID)) return;
            const ctx = canvas.getContext("2d")!;
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            map.addImage(COFFEE_ICON_ID, imageData, {
              pixelRatio: PILL_CANVAS_SCALE,
            });
          })
          .catch(() => {
            // Hover badge just won't render; the plain dot still shows.
          });

        if (onViewportChange) {
          if (initialCenter) {
            emitViewport(map, onViewportChange);
          } else {
            skipNextMoveEndRef.current = true;
            emitAfterInitialMoveRef.current = true;
            fitToMarkers(map, validCafes);
          }

          map.on("moveend", () => {
            if (skipNextMoveEndRef.current) {
              skipNextMoveEndRef.current = false;
              if (emitAfterInitialMoveRef.current) {
                emitAfterInitialMoveRef.current = false;
                emitViewport(map, onViewportChange);
              }
              return;
            }
            emitViewport(map, onViewportChange);
          });
        }

        const interactiveLayers = [
          PILL_LAYER_ID,
          PILL_HOVER_LAYER_ID,
          DOT_LAYER_ID,
          COFFEE_LAYER_ID,
        ];

        const handleSelect = (e: maplibregl.MapMouseEvent) => {
          const features = map.queryRenderedFeatures(e.point, {
            layers: interactiveLayers,
          });
          const feature = features[0];
          const id = feature?.properties?.id;
          if (typeof id !== "string" || id.length === 0) return;

          const cafe = cafesRef.current.find((c) => c.id === id);
          if (!cafe || cafe.lng == null || cafe.lat == null) return;

          // Detach the old popup first so its `close` handler (below) sees the
          // ref no longer points at it and doesn't clear the new selection.
          if (popupRef.current) {
            const old = popupRef.current;
            popupRef.current = null;
            old.remove();
          }

          onSelectCafe?.(id);

          const popup = new maplibregl.Popup({
            closeButton: true,
            closeOnClick: true,
            maxWidth: "260px",
            offset: 24,
            className: "cafe-popup",
          })
            .setLngLat([cafe.lng, cafe.lat])
            .setDOMContent(buildPopupCard(cafe))
            .addTo(map);
          popupRef.current = popup;

          // Closing the card (X or clicking the map) clears the selection so
          // the pin returns to its resting size. Clear both states directly
          // in case a lingering hover would otherwise keep it enlarged.
          popup.on("close", () => {
            if (popupRef.current === popup) {
              popupRef.current = null;
              map.setFeatureState(
                { source: SOURCE_ID, id },
                { hover: false, selected: false },
              );
              if (hoveredFeatureIdRef.current === id) {
                hoveredFeatureIdRef.current = null;
              }
              selectedFeatureIdRef.current = null;
              onSelectCafe?.(null);
            }
          });
        };

        const setCursorPointer = () => {
          map.getCanvas().style.cursor = "pointer";
        };
        const clearCursor = () => {
          map.getCanvas().style.cursor = "";
        };

        const handleHoverMove = (e: maplibregl.MapLayerMouseEvent) => {
          const feature = e.features?.[0];
          const id = feature?.properties?.id;
          if (typeof id !== "string" || id.length === 0) return;
          if (hoveredFeatureIdRef.current === id) return;
          if (hoveredFeatureIdRef.current) {
            map.setFeatureState(
              { source: SOURCE_ID, id: hoveredFeatureIdRef.current },
              { hover: false },
            );
          }
          hoveredFeatureIdRef.current = id;
          map.setFeatureState({ source: SOURCE_ID, id }, { hover: true });
        };

        const handleHoverLeave = () => {
          if (hoveredFeatureIdRef.current) {
            map.setFeatureState(
              { source: SOURCE_ID, id: hoveredFeatureIdRef.current },
              { hover: false },
            );
            hoveredFeatureIdRef.current = null;
          }
        };

        for (const layerId of interactiveLayers) {
          map.on("click", layerId, handleSelect);
          map.on("mouseenter", layerId, setCursorPointer);
          map.on("mouseleave", layerId, clearCursor);
          map.on("mousemove", layerId, handleHoverMove);
          map.on("mouseleave", layerId, handleHoverLeave);
        }
        // Pointer leaving the canvas entirely (e.g. onto the popup) doesn't
        // always fire a layer mouseleave, so clear hover here too.
        map.on("mouseout", handleHoverLeave);

        mapLoadedRef.current = true;
        if (pendingFocusRef.current) {
          const point = pendingFocusRef.current;
          pendingFocusRef.current = null;
          flyToPointOnMap(map, point);
        }
      });
    };

    void init();

    return () => {
      destroyed = true;
      // Drop the popup ref first so its `close` handler (fired by map.remove())
      // doesn't call back into React state during unmount.
      popupRef.current = null;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // Map is intentionally initialized only once; prop updates are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update source data when cafes change.
  useEffect(() => {
    cafesRef.current = cafes;

    const map = mapRef.current;
    if (!map) return;

    const source = map.getSource(SOURCE_ID) as
      | maplibregl.GeoJSONSource
      | undefined;
    if (!source) return;

    const validCafes = cafes.filter((c) => hasValidCoordinates(c.lat, c.lng));
    registerPillImages(map, validCafes, registeredPillIdsRef.current);
    source.setData(buildCafeGeoJSON(validCafes));

    // setData resets feature state, so re-pin the selected pin's enlarged
    // look if that cafe is still on the map (its card may still be open).
    const selectedId = selectedFeatureIdRef.current;
    if (selectedId) {
      if (validCafes.some((c) => c.id === selectedId)) {
        map.setFeatureState(
          { source: SOURCE_ID, id: selectedId },
          { selected: true },
        );
      } else {
        selectedFeatureIdRef.current = null;
      }
    }
    hoveredFeatureIdRef.current = null;
  }, [cafes]);

  // Update selected marker size only — selecting a cafe (by clicking its pin
  // or a card) no longer moves the camera.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!map.getLayer(PILL_LAYER_ID)) return;

    map.setLayoutProperty(PILL_LAYER_ID, "icon-size", [
      "case",
      ["==", ["get", "id"], selectedCafeId ?? ""],
      PILL_SIZE_SELECTED,
      PILL_SIZE_DEFAULT,
    ]);
  }, [selectedCafeId]);

  // Pin the "hovered/enlarged" look on the selected cafe via a `selected`
  // feature-state, so it stays up (grown pill / coffee badge / bigger dot)
  // while its card is open, regardless of where the mouse goes. The layers
  // key their hover visuals off `hover || selected`.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;
    if (!map.getSource(SOURCE_ID)) return;

    const prev = selectedFeatureIdRef.current;
    if (prev && prev !== selectedCafeId) {
      map.setFeatureState({ source: SOURCE_ID, id: prev }, { selected: false });
    }
    if (selectedCafeId) {
      map.setFeatureState(
        { source: SOURCE_ID, id: selectedCafeId },
        { selected: true },
      );
    }
    selectedFeatureIdRef.current = selectedCafeId ?? null;
  }, [selectedCafeId]);

  // Recenter when a focus point resolves (e.g. geolocation). Queued via
  // pendingFocusRef if it arrives before the map has finished loading.
  useEffect(() => {
    if (!flyToPoint) return;
    const map = mapRef.current;
    if (map && mapLoadedRef.current) {
      flyToPointOnMap(map, flyToPoint);
    } else {
      pendingFocusRef.current = flyToPoint;
    }
  }, [flyToPoint]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      aria-label="Map showing cafe locations"
    />
  );
}

function buildCafeGeoJSON(cafes: CafeSummary[]): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: cafes.map((cafe) => {
      const ratingNumber = cafe.rating ?? 0;
      const reviewCount = cafe.reviewCount ?? 0;
      return {
        type: "Feature",
        // A top-level feature id (distinct from properties.id) is required
        // for map.setFeatureState() to key hover state per cafe.
        id: cafe.id,
        geometry: {
          type: "Point",
          coordinates: [cafe.lng!, cafe.lat!],
        },
        properties: {
          id: cafe.id,
          name: cafe.name,
          rating: ratingNumber.toFixed(1),
          ratingNumber,
          reviewCount,
          pillIcon:
            ratingNumber > 0
              ? pillImageId(ratingNumber.toFixed(1), reviewCount)
              : "",
        },
      };
    }),
  };
}

function addDotLayer(map: maplibregl.Map) {
  if (map.getLayer(DOT_LAYER_ID)) return;
  map.addLayer({
    id: DOT_LAYER_ID,
    type: "circle",
    source: SOURCE_ID,
    paint: {
      // circle-radius is a paint property, so this feature-state grow
      // eases smoothly via the transition below. Stays grown while selected.
      "circle-radius": [
        "case",
        [
          "any",
          ["boolean", ["feature-state", "hover"], false],
          ["boolean", ["feature-state", "selected"], false],
        ],
        DOT_RADIUS_HOVER_PX,
        DOT_RADIUS_PX,
      ],
      "circle-radius-transition": { duration: HOVER_TRANSITION_MS, delay: 0 },
      "circle-color": PILL_COLOR,
      "circle-stroke-color": PILL_BORDER_COLOR,
      "circle-stroke-width": 1.5,
      "circle-opacity": 0.95,
    },
  });
}

function addPillLayer(
  map: maplibregl.Map,
  selectedCafeId: string | null | undefined,
) {
  if (map.getLayer(PILL_LAYER_ID)) return;
  map.addLayer({
    id: PILL_LAYER_ID,
    type: "symbol",
    source: SOURCE_ID,
    layout: {
      "icon-image": ["get", "pillIcon"],
      "icon-anchor": "bottom",
      // Left false (the default) so overlapping pins compete via
      // symbol-sort-key: the highest-rated one wins and stays visible,
      // the rest fall back to their plain dot until there's room.
      "icon-allow-overlap": false,
      "icon-ignore-placement": false,
      "icon-size": [
        "case",
        ["==", ["get", "id"], selectedCafeId ?? ""],
        PILL_SIZE_SELECTED,
        PILL_SIZE_DEFAULT,
      ],
      "symbol-sort-key": [
        "-",
        ["+", ["*", ["get", "ratingNumber"], 1000], ["get", "reviewCount"]],
      ],
      "symbol-z-order": "viewport-y",
    },
    paint: {
      // Cafes with no rating have no pillIcon registered; hide the symbol
      // for them so only the plain dot underneath shows.
      "icon-opacity": ["case", [">", ["get", "ratingNumber"], 0], 1, 0],
    },
  });
}

/** A slightly-larger copy of the rating pill, stacked on top of the base
 * pill and faded in via feature-state hover. `icon-size` is a *layout*
 * property, which MapLibre doesn't allow feature-state expressions on
 * (only paint properties support them) — so the "grow on hover" effect is
 * done by cross-fading in a bigger duplicate rather than resizing in place. */
function addPillHoverLayer(map: maplibregl.Map) {
  if (map.getLayer(PILL_HOVER_LAYER_ID)) return;
  map.addLayer({
    id: PILL_HOVER_LAYER_ID,
    type: "symbol",
    source: SOURCE_ID,
    layout: {
      "icon-image": ["get", "pillIcon"],
      "icon-anchor": "bottom",
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
      "icon-size": PILL_SIZE_HOVER,
    },
    paint: {
      "icon-opacity": [
        "case",
        [
          "all",
          [">", ["get", "ratingNumber"], 0],
          [
            "any",
            ["boolean", ["feature-state", "hover"], false],
            ["boolean", ["feature-state", "selected"], false],
          ],
        ],
        1,
        0,
      ],
      // Smoothly cross-fade the bigger duplicate in/out so the pill reads
      // as easing up in size rather than popping. Stays up while selected.
      "icon-opacity-transition": { duration: HOVER_TRANSITION_MS, delay: 0 },
    },
  });
}

function addCoffeeHoverLayer(map: maplibregl.Map) {
  if (map.getLayer(COFFEE_LAYER_ID)) return;
  map.addLayer({
    id: COFFEE_LAYER_ID,
    type: "symbol",
    source: SOURCE_ID,
    layout: {
      "icon-image": COFFEE_ICON_ID,
      "icon-anchor": "bottom",
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
      "icon-size": 1.0,
    },
    paint: {
      // Only cafes with no rating show this, and only while hovered or
      // selected — otherwise they're just the plain dot.
      "icon-opacity": [
        "case",
        [
          "all",
          ["==", ["get", "ratingNumber"], 0],
          [
            "any",
            ["boolean", ["feature-state", "hover"], false],
            ["boolean", ["feature-state", "selected"], false],
          ],
        ],
        1,
        0,
      ],
      "icon-opacity-transition": { duration: HOVER_TRANSITION_MS, delay: 0 },
    },
  });
}

function flyToPointOnMap(
  map: maplibregl.Map,
  point: { lat: number; lng: number },
) {
  map.flyTo({
    center: [point.lng, point.lat],
    zoom: Math.max(map.getZoom(), FLY_TO_ZOOM),
    essential: true,
  });
}

function svgIconDataUrl(path: string, color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="${color}" d="${path}"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("failed to load icon image"));
    img.src = src;
  });
}

/** Draws the hover-only coffee badge shown for unrated cafes — same pin
 * silhouette as the rating pill (badge + tail), but circular with a
 * centered Phosphor coffee glyph instead of rating text. */
async function buildCoffeePinCanvas(): Promise<HTMLCanvasElement> {
  const scale = PILL_CANVAS_SCALE;
  const diameter = 32 * scale;
  const tailHeight = 9 * scale;
  const tailHalfWidth = 7 * scale;
  const borderWidth = 2.5 * scale;
  const shadowPad = 6 * scale;

  const canvasWidth = diameter + borderWidth * 2 + shadowPad * 2;
  const canvasHeight = diameter + tailHeight + borderWidth * 2 + shadowPad * 2;

  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(canvasWidth);
  canvas.height = Math.ceil(canvasHeight);
  const ctx = canvas.getContext("2d")!;

  const radius = diameter / 2;
  const cx = canvas.width / 2;
  const circleLeft = (canvas.width - diameter) / 2;
  const circleRight = circleLeft + diameter;
  const circleTop = shadowPad + borderWidth;
  const circleBottom = circleTop + diameter;

  const path = new Path2D();
  path.moveTo(circleLeft + radius, circleTop);
  path.lineTo(circleRight - radius, circleTop);
  path.arcTo(circleRight, circleTop, circleRight, circleTop + radius, radius);
  path.arcTo(circleRight, circleBottom, circleRight - radius, circleBottom, radius);
  path.lineTo(cx + tailHalfWidth, circleBottom);
  path.lineTo(cx, circleBottom + tailHeight);
  path.lineTo(cx - tailHalfWidth, circleBottom);
  path.lineTo(circleLeft + radius, circleBottom);
  path.arcTo(circleLeft, circleBottom, circleLeft, circleBottom - radius, radius);
  path.arcTo(circleLeft, circleTop, circleLeft + radius, circleTop, radius);
  path.closePath();

  ctx.save();
  ctx.shadowColor = "rgba(15, 35, 20, 0.35)";
  ctx.shadowBlur = 5 * scale;
  ctx.shadowOffsetY = 2 * scale;
  ctx.fillStyle = PILL_COLOR;
  ctx.fill(path);
  ctx.restore();

  ctx.lineWidth = borderWidth;
  ctx.strokeStyle = PILL_BORDER_COLOR;
  ctx.stroke(path);

  const icon = await loadImage(svgIconDataUrl(COFFEE_ICON_PATH, PILL_TEXT_COLOR));
  const iconSize = 15 * scale;
  ctx.drawImage(
    icon,
    cx - iconSize / 2,
    circleTop + radius - iconSize / 2,
    iconSize,
    iconSize,
  );

  return canvas;
}

function escapeHtml(value: string): string {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

function iconSvg(path: string, size: number, fill: string): string {
  return `<svg viewBox="0 0 256 256" width="${size}" height="${size}" fill="${fill}" aria-hidden="true"><path d="${path}"/></svg>`;
}

/** Builds the mini cafe card shown in the click-popup — mirrors CafeCard's
 * "map" variant (cover image squared at the bottom, "New" badge, name with a
 * rating/coffee badge in the top-right, area, tags) as plain DOM, since it's
 * rendered outside React. No heart, no distance. */
function buildPopupCard(cafe: CafeSummary): HTMLElement {
  const name = escapeHtml(cafe.name);
  const area = cafe.neighborhood ?? cafe.city ?? "";
  const visibleTags = cafe.tags.slice(0, 2);

  const cover = cafe.coverImage
    ? `<img src="${escapeHtml(cafe.coverImage)}" alt="${name}" class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />`
    : `<div class="flex h-full w-full items-center justify-center text-xs text-zinc-400">${name}</div>`;

  const newBadge = cafe.isNew
    ? `<span class="absolute left-3 top-3 rounded-full bg-[#3A5A40] px-2.5 py-0.5 text-[11px] font-semibold text-white">New</span>`
    : "";

  const ratingBadge =
    cafe.rating > 0
      ? `<span class="flex shrink-0 items-center gap-1 text-xs font-medium text-[#3b3b3b]">
           ${iconSvg(STAR_FILL_PATH, 13, "#3A5A40")}${cafe.rating.toFixed(1)}
           <span class="text-zinc-400">(${cafe.reviewCount})</span>
         </span>`
      : `<span class="flex shrink-0 items-center text-zinc-400">
           ${iconSvg(COFFEE_ICON_PATH, 15, "currentColor")}
         </span>`;

  const tagsHtml = visibleTags
    .map(
      (tag) =>
        `<span class="rounded-full border border-zinc-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-[#3b3b3b]">${escapeHtml(
          tag,
        )}</span>`,
    )
    .join("");

  const container = document.createElement("div");
  container.className = "cafe-popup-card w-64 overflow-hidden rounded-2xl bg-white";
  container.innerHTML = `
    <a href="/cafes/${cafe.id}" class="group block">
      <div class="relative aspect-[4/3] w-full overflow-hidden rounded-t-xl bg-zinc-100">
        ${cover}
        ${newBadge}
      </div>
      <div class="px-3 pb-3 pt-3">
        <div class="flex items-center justify-between gap-2">
          <span class="truncate text-sm font-semibold text-[#3b3b3b]">${name}</span>
          ${ratingBadge}
        </div>
        ${area ? `<p class="mt-1 truncate text-xs text-zinc-500">${escapeHtml(area)}</p>` : ""}
        ${tagsHtml ? `<div class="mt-3 flex flex-wrap items-center gap-1.5">${tagsHtml}</div>` : ""}
      </div>
    </a>
  `;
  return container;
}

function emitViewport(
  map: maplibregl.Map,
  onViewportChange: (viewport: MapViewport) => void,
) {
  const center = map.getCenter();
  const bounds = map.getBounds();
  onViewportChange({
    center: { lat: center.lat, lng: center.lng },
    bounds: {
      north: bounds.getNorth(),
      east: bounds.getEast(),
      south: bounds.getSouth(),
      west: bounds.getWest(),
    },
    zoom: map.getZoom(),
  });
}

function pillImageId(ratingLabel: string, reviewCount: number) {
  return `pill-${ratingLabel}-${reviewCount}`;
}

/** Ensures a canvas-drawn pill badge exists on the map for every distinct
 * rating/review-count combination present in `cafes`. Skips cafes with no
 * rating (0), since those render as a plain dot instead. */
function registerPillImages(
  map: maplibregl.Map,
  cafes: CafeSummary[],
  registered: Set<string>,
) {
  const entries = new Map<string, { rating: string; reviewCount: number }>();
  for (const cafe of cafes) {
    const rating = cafe.rating ?? 0;
    if (rating <= 0) continue;
    const reviewCount = cafe.reviewCount ?? 0;
    const ratingLabel = rating.toFixed(1);
    entries.set(pillImageId(ratingLabel, reviewCount), {
      rating: ratingLabel,
      reviewCount,
    });
  }

  for (const [id, { rating, reviewCount }] of entries) {
    if (registered.has(id) || map.hasImage(id)) {
      registered.add(id);
      continue;
    }
    const canvas = drawPillCanvas(rating, reviewCount);
    const ctx = canvas.getContext("2d")!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    map.addImage(id, imageData, { pixelRatio: PILL_CANVAS_SCALE });
    registered.add(id);
  }
}

/** Draws a stadium-shaped pill with a star, rating text, review count, and
 * a pointer tail onto an offscreen canvas. The tail tip sits at the
 * bottom-center of the canvas so it lines up with icon-anchor: "bottom". */
function drawPillCanvas(
  ratingLabel: string,
  reviewCount: number,
): HTMLCanvasElement {
  const scale = PILL_CANVAS_SCALE;
  const ratingFont = `500 ${15 * scale}px 'Inter', 'Helvetica Neue', Arial, sans-serif`;
  const reviewFont = `500 ${12 * scale}px 'Inter', 'Helvetica Neue', Arial, sans-serif`;
  const reviewLabel = reviewCount > 0 ? `(${formatReviewCount(reviewCount)})` : "";

  const measure = document.createElement("canvas").getContext("2d")!;
  measure.font = ratingFont;
  const ratingWidth = measure.measureText(ratingLabel).width;
  measure.font = reviewFont;
  const reviewWidth = reviewLabel ? measure.measureText(reviewLabel).width : 0;

  const starSize = 12 * scale;
  const gap = 5 * scale;
  const reviewGap = reviewLabel ? 4 * scale : 0;
  const paddingX = 12 * scale;
  const pillHeight = 32 * scale;
  const tailHeight = 9 * scale;
  const tailHalfWidth = 7 * scale;
  const borderWidth = 2.5 * scale;
  const shadowPad = 6 * scale;

  const contentWidth =
    starSize + gap + ratingWidth + reviewGap + reviewWidth;
  const pillWidth = contentWidth + paddingX * 2;

  const canvasWidth = pillWidth + borderWidth * 2 + shadowPad * 2;
  const canvasHeight =
    pillHeight + tailHeight + borderWidth * 2 + shadowPad * 2;

  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(canvasWidth);
  canvas.height = Math.ceil(canvasHeight);
  const ctx = canvas.getContext("2d")!;

  const radius = pillHeight / 2;
  const cx = canvas.width / 2;
  const pillLeft = (canvas.width - pillWidth) / 2;
  const pillRight = pillLeft + pillWidth;
  const pillTop = shadowPad + borderWidth;
  const pillBottom = pillTop + pillHeight;

  const path = new Path2D();
  path.moveTo(pillLeft + radius, pillTop);
  path.lineTo(pillRight - radius, pillTop);
  path.arcTo(pillRight, pillTop, pillRight, pillTop + radius, radius);
  path.arcTo(pillRight, pillBottom, pillRight - radius, pillBottom, radius);
  path.lineTo(cx + tailHalfWidth, pillBottom);
  path.lineTo(cx, pillBottom + tailHeight);
  path.lineTo(cx - tailHalfWidth, pillBottom);
  path.lineTo(pillLeft + radius, pillBottom);
  path.arcTo(pillLeft, pillBottom, pillLeft, pillBottom - radius, radius);
  path.arcTo(pillLeft, pillTop, pillLeft + radius, pillTop, radius);
  path.closePath();

  ctx.save();
  ctx.shadowColor = "rgba(15, 35, 20, 0.35)";
  ctx.shadowBlur = 5 * scale;
  ctx.shadowOffsetY = 2 * scale;
  ctx.fillStyle = PILL_COLOR;
  ctx.fill(path);
  ctx.restore();

  ctx.lineWidth = borderWidth;
  ctx.strokeStyle = PILL_BORDER_COLOR;
  ctx.stroke(path);

  const starCx = pillLeft + paddingX + starSize / 2;
  const starCy = pillTop + pillHeight / 2;
  drawStar(ctx, starCx, starCy, starSize / 2, PILL_TEXT_COLOR);

  const textY = pillTop + pillHeight / 2 + scale * 0.5;
  let textX = pillLeft + paddingX + starSize + gap;

  ctx.font = ratingFont;
  ctx.fillStyle = PILL_TEXT_COLOR;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(ratingLabel, textX, textY);
  textX += ratingWidth + reviewGap;

  if (reviewLabel) {
    ctx.font = reviewFont;
    ctx.fillStyle = "rgba(255, 255, 255, 0.78)";
    ctx.fillText(reviewLabel, textX, textY);
  }

  return canvas;
}

/** Abbreviates large review counts, e.g. 128 -> "128", 1240 -> "1.2k". */
function formatReviewCount(count: number): string {
  if (count < 1000) return String(count);
  const thousands = count / 1000;
  return `${thousands.toFixed(thousands < 10 ? 1 : 0)}k`;
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  color: string,
) {
  const spikes = 5;
  const innerRadius = radius * 0.45;
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - radius);
  for (let i = 0; i < spikes; i++) {
    let x = cx + Math.cos(rot) * radius;
    let y = cy + Math.sin(rot) * radius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - radius);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function fitToMarkers(map: maplibregl.Map, cafes: CafeSummary[]) {
  const coordinates = cafes
    .filter((c) => c.lng != null && c.lat != null)
    .map((c) => [c.lng!, c.lat!] as [number, number]);

  if (coordinates.length === 0) return;

  if (coordinates.length === 1) {
    map.flyTo({
      center: coordinates[0],
      zoom: 15.5,
      essential: true,
    });
    return;
  }

  let minLng = coordinates[0][0];
  let maxLng = coordinates[0][0];
  let minLat = coordinates[0][1];
  let maxLat = coordinates[0][1];

  for (const [lng, lat] of coordinates) {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }

  map.fitBounds(
    [
      [minLng, minLat],
      [maxLng, maxLat],
    ],
    { padding: 60, maxZoom: 15, duration: 800 },
  );
}
