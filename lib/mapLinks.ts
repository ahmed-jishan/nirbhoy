/**
 * Parses a variety of user-supplied location inputs into { lat, lng }.
 *
 * Supported formats:
 *   - Plain coordinates: "23.7104, 90.4074" or "23.7104 90.4074"
 *   - Google Maps URLs:
 *       https://www.google.com/maps/@23.7104,90.4074,17z
 *       https://www.google.com/maps/place/…/@23.7104,90.4074,17z
 *       https://maps.google.com/?q=23.7104,90.4074
 *       https://goo.gl/maps/... (short links are NOT resolved — user should paste full URL)
 *   - OpenStreetMap URLs:
 *       https://www.openstreetmap.org/#map=17/23.7104/90.4074
 *       https://www.openstreetmap.org/?mlat=23.7104&mlon=90.4074
 *   - Bing/Apple maps also fall back through the query-string parser.
 *
 * Returns null if nothing plausible is found or coordinates are outside
 * Bangladesh's bounding box (we keep this tight to catch typos early).
 */

// Bangladesh bounding box — reports outside this range are rejected because
// the whole platform is scoped to Bangladesh.
const BD_BOUNDS = {
  minLat: 20.5,
  maxLat: 26.7,
  minLng: 88.0,
  maxLng: 92.7,
};

export type ParsedCoords = { lat: number; lng: number };

function inBangladesh(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= BD_BOUNDS.minLat &&
    lat <= BD_BOUNDS.maxLat &&
    lng >= BD_BOUNDS.minLng &&
    lng <= BD_BOUNDS.maxLng
  );
}

// Try to extract lat/lng from a raw string. Matches patterns like
// "23.7104, 90.4074" or "23.7104 90.4074" anywhere in the string.
function parsePlainCoords(input: string): ParsedCoords | null {
  // Trim and normalize whitespace/commas
  const cleaned = input.replace(/[\s,]+/g, " ").trim();
  const match = cleaned.match(/(-?\d{1,3}\.\d+)\s+(-?\d{1,3}\.\d+)/);
  if (!match) return null;
  const lat = parseFloat(match[1]);
  const lng = parseFloat(match[2]);
  if (!inBangladesh(lat, lng)) return null;
  return { lat, lng };
}

// Google Maps has coordinates embedded after `@` in the URL path.
function parseGoogleMapsUrl(url: URL): ParsedCoords | null {
  // /@lat,lng,zoom pattern
  const atMatch = url.pathname.match(/@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lng = parseFloat(atMatch[2]);
    if (inBangladesh(lat, lng)) return { lat, lng };
  }

  // ?q=lat,lng or ?ll=lat,lng
  const qParams = ["q", "ll", "query", "center"];
  for (const key of qParams) {
    const val = url.searchParams.get(key);
    if (val) {
      const parsed = parsePlainCoords(val);
      if (parsed) return parsed;
    }
  }

  return null;
}

// OpenStreetMap URLs — either #map=zoom/lat/lng or ?mlat=&mlon=
function parseOsmUrl(url: URL): ParsedCoords | null {
  // Hash: #map=17/23.7104/90.4074
  if (url.hash) {
    const hashMatch = url.hash.match(/map=[\d.]+\/(-?\d{1,3}\.\d+)\/(-?\d{1,3}\.\d+)/);
    if (hashMatch) {
      const lat = parseFloat(hashMatch[1]);
      const lng = parseFloat(hashMatch[2]);
      if (inBangladesh(lat, lng)) return { lat, lng };
    }
  }

  // Query params: mlat / mlon
  const mlat = url.searchParams.get("mlat");
  const mlon = url.searchParams.get("mlon");
  if (mlat && mlon) {
    const lat = parseFloat(mlat);
    const lng = parseFloat(mlon);
    if (inBangladesh(lat, lng)) return { lat, lng };
  }

  return null;
}

/**
 * Main entry point — accepts any string the user types or pastes and returns
 * coordinates when possible.
 */
export function parseLocationInput(raw: string): ParsedCoords | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // First try plain "lat, lng" — cheapest and most common.
  const direct = parsePlainCoords(trimmed);
  if (direct) return direct;

  // Then try URL parsing.
  let url: URL;
  try {
    // If user pasted a URL without protocol, add one to make it parseable.
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    url = new URL(withProtocol);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase();

  if (host.includes("google.") || host.includes("goo.gl")) {
    const parsed = parseGoogleMapsUrl(url);
    if (parsed) return parsed;
  }

  if (host.includes("openstreetmap.org") || host.includes("osm.org")) {
    const parsed = parseOsmUrl(url);
    if (parsed) return parsed;
  }

  // Generic fallback: look for lat/lng-style params on any URL.
  const genericParams = ["lat", "latitude"];
  const lat = genericParams.map((k) => url.searchParams.get(k)).find(Boolean);
  const lngParams = ["lng", "lon", "longitude"];
  const lng = lngParams.map((k) => url.searchParams.get(k)).find(Boolean);
  if (lat && lng) {
    const la = parseFloat(lat);
    const ln = parseFloat(lng);
    if (inBangladesh(la, ln)) return { lat: la, lng: ln };
  }

  // Last resort: search the whole URL string for lat,lng pattern.
  return parsePlainCoords(url.toString());
}

/**
 * Build a Google Maps deep link that opens the pin location. Used on
 * marker popups and the admin review page.
 */
export function googleMapsLink(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export function osmMapsLink(lat: number, lng: number): string {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;
}
