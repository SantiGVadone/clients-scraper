import type { ProviderCapabilities, SearchFilters, SearchParams } from "./types";

export interface FormState {
  query: string;
  zone: string;
  limit: number;
  provider: SearchParams["provider"];
  minReviews: string;
  minRating: string;
  hasWebsite: "" | "true" | "false";
  hasPhone: "" | "true" | "false";
}

export const initialForm: FormState = {
  query: "dentista",
  zone: "Merlo, Buenos Aires",
  limit: 50,
  provider: "osm",
  minReviews: "",
  minRating: "",
  hasWebsite: "",
  hasPhone: "",
};

/** Los filtros no soportados nunca se envían: el backend avisa en warnings. */
export function toSearchParams(form: FormState, capabilities: ProviderCapabilities): SearchParams {
  const filters: SearchFilters = {};
  if (capabilities.reviews && form.minReviews !== "") {
    filters.minReviews = Number(form.minReviews);
  }
  if (capabilities.rating && form.minRating !== "") {
    filters.minRating = Number(form.minRating);
  }
  if (form.hasWebsite !== "") filters.hasWebsite = form.hasWebsite === "true";
  if (form.hasPhone !== "") filters.hasPhone = form.hasPhone === "true";

  return {
    query: form.query,
    zone: form.zone,
    limit: form.limit,
    provider: form.provider,
    filters,
  };
}
