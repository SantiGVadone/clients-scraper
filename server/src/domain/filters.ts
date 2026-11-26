import type { Place } from "./place";
import type { SearchFilters } from "./search";

/** Función pura: no muta la entrada y no depende del proveedor. */
export function applyFilters(places: readonly Place[], filters: SearchFilters): Place[] {
  return places.filter((place) => {
    if (filters.minReviews !== undefined && (place.reviewCount ?? 0) < filters.minReviews) {
      return false;
    }
    if (filters.minRating !== undefined && (place.rating ?? 0) < filters.minRating) {
      return false;
    }
    if (filters.hasWebsite !== undefined && Boolean(place.website) !== filters.hasWebsite) {
      return false;
    }
    if (filters.hasPhone !== undefined && Boolean(place.phone) !== filters.hasPhone) {
      return false;
    }
    return true;
  });
}
