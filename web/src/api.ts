import type {
  Coordinate,
  GeocodedPlace,
  Place,
  ProviderDescriptor,
  RouteMode,
  RouteResult,
  SearchParams,
  SearchResponse,
} from "./types";

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    throw new Error(body?.error?.message ?? `Error ${response.status} al consultar la API.`);
  }
  return (await response.json()) as T;
}

export function fetchProviders(): Promise<ProviderDescriptor[]> {
  return getJson<ProviderDescriptor[]>("/api/providers");
}

export function searchPlaces(params: SearchParams): Promise<SearchResponse> {
  return getJson<SearchResponse>(`/api/search?${toQueryString(params)}`);
}

export function geocodeAddress(address: string): Promise<GeocodedPlace> {
  return getJson<GeocodedPlace>(`/api/geocode?address=${encodeURIComponent(address)}`);
}

export interface PlanRouteInput {
  origin: Coordinate;
  places: Place[];
  mode: RouteMode;
}

export function planRoute(input: PlanRouteInput): Promise<RouteResult> {
  return postJson<RouteResult>("/api/route", input);
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (cause) {
    throw new Error(
      `No se pudo conectar con la API: ${cause instanceof Error ? cause.message : "error desconocido"}`,
    );
  }
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    throw new Error(payload?.error?.message ?? `Error ${response.status} al planificar el recorrido.`);
  }
  return (await response.json()) as T;
}

export function exportCsvUrl(params: SearchParams): string {
  return `/api/search/export.csv?${toQueryString(params)}`;
}

function toQueryString(params: SearchParams): string {
  const query = new URLSearchParams({
    query: params.query,
    zone: params.zone,
    limit: String(params.limit),
    provider: params.provider,
  });

  if (params.filters.minReviews !== undefined) {
    query.set("minReviews", String(params.filters.minReviews));
  }
  if (params.filters.minRating !== undefined) {
    query.set("minRating", String(params.filters.minRating));
  }
  if (params.filters.hasWebsite !== undefined) {
    query.set("hasWebsite", String(params.filters.hasWebsite));
  }
  if (params.filters.hasPhone !== undefined) {
    query.set("hasPhone", String(params.filters.hasPhone));
  }

  return query.toString();
}
