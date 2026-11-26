import { ProviderUnavailableError } from "../../../domain/errors";
import { ensureSuccessfulResponse, type FetchFn } from "../../fetch";
import type { BoundingBox } from "./nominatim-client";

export interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export interface OverpassResponse {
  elements: OverpassElement[];
}

export interface OverpassClient {
  query(bbox: BoundingBox, tagFilters: readonly string[][]): Promise<OverpassResponse>;
}

/** Convierte ["leisure", "pitch", "sport=soccer|football"] en clauses de Overpass. */
export function buildOverpassQuery(bbox: BoundingBox, tagFilters: readonly string[][]): string {
  const area = `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`;
  const clauses = tagFilters.map((filter) => {
    const [key, value, ...extras] = filter;
    const selectors = [`["${key}"="${value}"]`, ...extras.map(toExtraSelector)];
    return `  nwr${selectors.join("")}(${area});`;
  });

  return `[out:json][timeout:25];\n(\n${clauses.join("\n")}\n);\nout center tags;`;
}

function toExtraSelector(token: string): string {
  const separator = token.indexOf("=");
  if (separator === -1) return `["${token}"]`;

  const key = token.slice(0, separator);
  const values = token.slice(separator + 1).split("|");
  if (values.length === 1) return `["${key}"="${values[0]}"]`;
  return `["${key}"~"^(${values.join("|")})$"]`;
}

export function createOverpassClient(options: {
  endpoint?: string;
  userAgent?: string;
  fetchFn?: FetchFn;
}): OverpassClient {
  const endpoint = options.endpoint ?? "https://overpass-api.de/api/interpreter";

  return {
    async query(bbox, tagFilters) {
      const body = new URLSearchParams({ data: buildOverpassQuery(bbox, tagFilters) });
      const response = await (options.fetchFn ?? fetch)(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          ...(options.userAgent ? { "User-Agent": options.userAgent } : {}),
        },
        body: body.toString(),
      });
      ensureSuccessfulResponse(response, "osm");

      const payload = (await response.json()) as Partial<OverpassResponse>;
      if (!Array.isArray(payload.elements)) {
        throw new ProviderUnavailableError("osm", {
          cause: new Error("Respuesta de Overpass sin elementos"),
        });
      }
      return { elements: payload.elements };
    },
  };
}
