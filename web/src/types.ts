export type ProviderName = "google" | "osm";
export type ProviderSelection = ProviderName | "auto";

export interface ProviderCapabilities {
  reviews: boolean;
  rating: boolean;
}

export interface ProviderDescriptor {
  name: ProviderName;
  enabled: boolean;
  capabilities: ProviderCapabilities;
}

export interface Place {
  id: string;
  source: ProviderName;
  name: string;
  address?: string;
  lat?: number;
  lng?: number;
  rating?: number;
  reviewCount?: number;
  phone?: string;
  website?: string;
  mapsUrl?: string;
  openNow?: boolean;
  businessStatus?: string;
}

export interface SearchFilters {
  minReviews?: number;
  minRating?: number;
  hasWebsite?: boolean;
  hasPhone?: boolean;
}

export interface SearchParams {
  query: string;
  zone: string;
  limit: number;
  provider: ProviderSelection;
  filters: SearchFilters;
}

export interface SearchResponse {
  provider: ProviderName;
  fromCache: boolean;
  total: number;
  results: Place[];
  warnings: string[];
}

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface GeocodedPlace extends Coordinate {
  label: string;
}

export type RouteMode = "mobile" | "desktop";

export interface RouteStop {
  place: Place;
  coordinate: Coordinate;
  stop: number;
  distanceFromPreviousKm: number;
}

export interface RouteChunk {
  index: number;
  fromStop: number;
  toStop: number;
  label: string;
  url: string;
}

export interface RouteResult {
  origin: Coordinate;
  ordered: RouteStop[];
  totalDistanceKm: number;
  withoutLocation: Place[];
  chunks: RouteChunk[];
  warnings: string[];
}
