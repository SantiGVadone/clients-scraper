import type { Place } from "../../domain/place";
import type { SearchParams } from "../../domain/search";
import type { SearchPlaces } from "./search-places";

/** Serializador inyectado: la aplicación no importa el adaptador CSV. */
export type SerializeCsv = (places: readonly Place[]) => string;

export interface ExportPlaces {
  (params: SearchParams): Promise<{ csv: string; warnings: string[] }>;
}

export function createExportPlaces(options: {
  searchPlaces: SearchPlaces;
  serializeCsv: SerializeCsv;
}): ExportPlaces {
  return async (params) => {
    const result = await options.searchPlaces(params);
    return { csv: options.serializeCsv(result.results), warnings: result.warnings };
  };
}
