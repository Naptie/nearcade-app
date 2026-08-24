/** Geodesy + slippy-map tile helpers. */

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.asin(Math.sqrt(a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// ---- Slippy map math (OSM tile scheme) ----

export function lngToTileX(lng: number, zoom: number): number {
  return ((lng + 180) / 360) * Math.pow(2, zoom);
}

export function latToTileY(lat: number, zoom: number): number {
  const clamped = clamp(lat, -85.05112878, 85.05112878);
  const rad = toRad(clamped);
  return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * Math.pow(2, zoom);
}

export function tileXToLng(x: number, zoom: number): number {
  return (x / Math.pow(2, zoom)) * 360 - 180;
}

export function tileYToLat(y: number, zoom: number): number {
  const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, zoom);
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

/** World-pixel coordinates at a given zoom (256px tiles). */
export function worldPixel(lng: number, lat: number, zoom: number): { x: number; y: number } {
  return { x: lngToTileX(lng, zoom) * 256, y: latToTileY(lat, zoom) * 256 };
}

export function osmTileUrl(x: number, y: number, zoom: number): string {
  const sub = ['a', 'b', 'c'][Math.abs(x + y) % 3];
  return `https://${sub}.tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
}
