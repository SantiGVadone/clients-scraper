import type { Place, ProviderName } from "./place";

export type ProviderSelection = ProviderName | "auto";

/** Lo que cada proveedor puede informar. La UI deshabilita filtros según esto. */
export interface ProviderCapabilities {
  reviews: boolean;
  rating: boolean;
}

export interface SearchFilters {
  minReviews?: number;
  minRating?: number;
  /** true = con web, false = sin web, undefined = indistinto. */
  hasWebsite?: boolean;
  hasPhone?: boolean;
}

export interface SearchParams {
  query: string;
  zone: string;
  limit: number;
  filters: SearchFilters;
  provider: ProviderSelection;
}

/** Respuesta de GET /api/providers. */
export interface ProviderDescriptor {
  name: ProviderName;
  enabled: boolean;
  capabilities: ProviderCapabilities;
}

/** Respuesta de GET /api/search. */
export interface SearchResponse {
  /** Proveedor efectivamente usado (auto ya resuelto). */
  provider: ProviderName;
  fromCache: boolean;
  total: number;
  results: Place[];
  warnings: string[];
}
