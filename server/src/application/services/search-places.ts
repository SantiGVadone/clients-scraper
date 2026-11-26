import { applyFilters } from "../../domain/filters";
import type { ProviderName } from "../../domain/place";
import type { SearchParams, SearchResponse } from "../../domain/search";
import type { PlacesProvider } from "../ports/places-provider";
import type { SearchCache } from "../ports/search-cache";

/** Los params ya vienen validados y con defaults aplicados por el controller. */
export interface SearchPlaces {
  (params: SearchParams): Promise<SearchResponse>;
}

/**
 * Factory: el composition root inyecta providers, caché y el provider por defecto.
 * La resolución de `auto` vive acá, en un único lugar.
 */
export function createSearchPlaces(options: {
  providers: Record<ProviderName, PlacesProvider>;
  cache: SearchCache;
  defaultProvider: ProviderName;
}): SearchPlaces {
  return async (params) => {
    const providerName: ProviderName =
      params.provider === "auto" ? options.defaultProvider : params.provider;
    const provider = options.providers[providerName];
    const key = buildCacheKey(providerName, params.query, params.zone);

    const cached = await options.cache.get(key);
    const fromCache = cached !== undefined;
    const places = cached ?? (await provider.search({ query: params.query, zone: params.zone }));
    if (!fromCache) {
      await options.cache.set(key, places);
    }

    const warnings = [...provider.warnings];
    const filters = { ...params.filters };
    if (params.provider === "auto") {
      warnings.push(`provider=auto se resolvió como "${providerName}".`);
    }
    if (filters.minReviews !== undefined && !provider.capabilities.reviews) {
      warnings.push(
        `El proveedor "${providerName}" no soporta reseñas: se ignoró el filtro minReviews.`,
      );
      delete filters.minReviews;
    }
    if (filters.minRating !== undefined && !provider.capabilities.rating) {
      warnings.push(
        `El proveedor "${providerName}" no soporta rating: se ignoró el filtro minRating.`,
      );
      delete filters.minRating;
    }

    const filtered = applyFilters(places, filters);
    return {
      provider: providerName,
      fromCache,
      // Total de coincidencias antes del límite, para que la UI sepa que hay más.
      total: filtered.length,
      results: filtered.slice(0, params.limit),
      warnings,
    };
  };
}

/** La clave no incluye filtros ni limit: se guardan los datos crudos del proveedor. */
function buildCacheKey(provider: ProviderName, query: string, zone: string): string {
  const normalize = (value: string): string => value.trim().toLocaleLowerCase("es");
  return `${provider}|${normalize(query)}|${normalize(zone)}`;
}
