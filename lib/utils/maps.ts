/** Geographic + viewport helpers shared by the map UI. */

export type LatLng = {
  lat: number;
  lng: number;
};

export type MapBounds = {
  north: number;
  east: number;
  south: number;
  west: number;
};

export type MapViewport = {
  center: LatLng;
  bounds: MapBounds;
  zoom: number;
};

/** Great-circle distance between two points, in meters. */
export function haversineMeters(a: LatLng, b: LatLng): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Radius (meters) from a viewport's center to its farthest corner. Used to
 * decide whether the visible area fits inside a fixed search radius. */
export function viewportRadiusMeters(viewport: MapViewport): number {
  const { center, bounds } = viewport;
  return haversineMeters(center, { lat: bounds.north, lng: bounds.east });
}

/** True when both coordinates are finite numbers inside valid lat/lng ranges. */
export function hasValidCoordinates(
  lat: number | null | undefined,
  lng: number | null | undefined,
): lat is number {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}
