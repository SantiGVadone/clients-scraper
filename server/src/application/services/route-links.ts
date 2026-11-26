import type { Coordinate } from "../../domain/coordinates";
import type { RouteStop } from "../../domain/route";

export type RouteMode = "mobile" | "desktop";

/**
 * Google Maps URLs (docs vigentes, nov 2026): hasta 3 waypoints en navegadores
 * móviles y 9 en el resto; cada URL admite como máximo 2.048 caracteres.
 * El último punto del tramo va como `destination`, no como waypoint.
 */
export const CHUNK_SIZE: Record<RouteMode, number> = {
  mobile: 4,
  desktop: 10,
};

const MAX_URL_LENGTH = 2048;

export interface RouteChunk {
  index: number;
  fromStop: number;
  toStop: number;
  label: string;
  url: string;
}

export interface RouteLinksResult {
  chunks: RouteChunk[];
  warnings: string[];
}

/** Tramos encadenados: el origen del tramo k es la última parada del anterior. */
export function buildRouteLinks(
  origin: Coordinate,
  ordered: readonly RouteStop[],
  mode: RouteMode,
  maxUrlLength = MAX_URL_LENGTH,
): RouteLinksResult {
  const size = CHUNK_SIZE[mode];
  const chunks: RouteChunk[] = [];
  const warnings: string[] = [];

  for (let start = 0; start < ordered.length; start += size) {
    const stops = ordered.slice(start, start + size);
    const first = stops[0];
    const last = stops[stops.length - 1];
    const from = start === 0 ? origin : ordered[start - 1].coordinate;

    const params = new URLSearchParams({
      api: "1",
      origin: `${from.lat},${from.lng}`,
      destination: `${last.coordinate.lat},${last.coordinate.lng}`,
      travelmode: "driving",
    });
    const waypoints = stops
      .slice(0, -1)
      .map((stop) => `${stop.coordinate.lat},${stop.coordinate.lng}`)
      .join("|");
    if (waypoints) params.set("waypoints", waypoints);

    const url = `https://www.google.com/maps/dir/?${params.toString()}`;
    const index = chunks.length + 1;
    if (url.length > maxUrlLength) {
      warnings.push(
        `Tramo ${index}: la URL supera los ${maxUrlLength} caracteres permitidos por Google Maps.`,
      );
    }

    chunks.push({
      index,
      fromStop: first.stop,
      toStop: last.stop,
      label: `Tramo ${index}: paradas ${first.stop} a ${last.stop}`,
      url,
    });
  }

  return { chunks, warnings };
}
