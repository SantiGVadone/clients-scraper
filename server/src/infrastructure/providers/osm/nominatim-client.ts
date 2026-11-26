import { ZoneNotFoundError } from "../../../domain/errors";
import { ensureSuccessfulResponse, type FetchFn } from "../../fetch";
import { createRateLimiter } from "./rate-limiter";

export interface BoundingBox {
  south: number;
  north: number;
  west: number;
  east: number;
}

export interface GeocodedPoint {
  lat: number;
  lng: number;
  label: string;
}

interface NominatimResult {
  boundingbox?: string[];
  lat?: string;
  lon?: string;
  display_name?: string;
}

export interface NominatimClient {
  geocode(zone: string): Promise<BoundingBox>;
  geocodePoint(address: string): Promise<GeocodedPoint>;
}

export function createNominatimClient(options: {
  userAgent: string;
  baseUrl?: string;
  /** Nominatim público: máximo 1 request por segundo. */
  minIntervalMs?: number;
  fetchFn?: FetchFn;
}): NominatimClient {
  const baseUrl = options.baseUrl ?? "https://nominatim.openstreetmap.org";
  const fetchFn = options.fetchFn ?? fetch;
  // Un único limitador por cliente: OSM y /api/geocode comparten el mismo cliente.
  const rateLimit = createRateLimiter(options.minIntervalMs ?? 1000);

  async function search(query: string): Promise<NominatimResult[]> {
    await rateLimit();

    const url = new URL("/search", baseUrl);
    url.searchParams.set("q", query);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "1");

    const response = await fetchFn(url.toString(), {
      headers: { "User-Agent": options.userAgent },
    });
    ensureSuccessfulResponse(response, "osm");
    return (await response.json()) as NominatimResult[];
  }

  return {
    async geocode(zone) {
      const box = (await search(zone))[0]?.boundingbox;
      if (!box || box.length !== 4) {
        throw new ZoneNotFoundError(zone);
      }

      const [south, north, west, east] = box.map(Number);
      if ([south, north, west, east].some((value) => !Number.isFinite(value))) {
        throw new ZoneNotFoundError(zone);
      }
      return { south, north, west, east };
    },

    async geocodePoint(address) {
      const first = (await search(address))[0];
      if (!first || first.lat === undefined || first.lon === undefined) {
        throw new ZoneNotFoundError(address);
      }

      const lat = Number(first.lat);
      const lng = Number(first.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new ZoneNotFoundError(address);
      }
      return { lat, lng, label: first.display_name ?? address };
    },
  };
}
