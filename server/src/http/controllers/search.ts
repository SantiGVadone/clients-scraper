import type { FastifyRequest } from "fastify";
import type { ProviderDescriptor, SearchResponse } from "../../domain/search";
import type { SearchPlaces } from "../../application/services/search-places";
import type { SearchParams } from "../../domain/search";
import type { ExportPlaces } from "../../application/services/export-places";
import { searchQuerySchema, toSearchParams } from "../schemas/search";

export interface SearchController {
  search(request: FastifyRequest): Promise<SearchResponse>;
  exportCsv(request: FastifyRequest): Promise<{ csv: string; warnings: string[] }>;
  providers(): ProviderDescriptor[];
}

export function createSearchController(options: {
  searchPlaces: SearchPlaces;
  exportPlaces: ExportPlaces;
  providers: ProviderDescriptor[];
}): SearchController {
  const parseParams = (query: unknown): SearchParams => {
    // ZodError se traduce a 400 en el error handler.
    return toSearchParams(searchQuerySchema.parse(query));
  };

  return {
    search(request) {
      return options.searchPlaces(parseParams(request.query));
    },
    exportCsv(request) {
      return options.exportPlaces(parseParams(request.query));
    },
    providers() {
      return options.providers;
    },
  };
}
