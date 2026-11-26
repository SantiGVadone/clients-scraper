import type { Place } from "../../domain/place";

/** Persistencia temporal de resultados crudos (sin filtrar ni limitar). */
export interface SearchCache {
  get(key: string): Promise<Place[] | undefined>;
  set(key: string, places: readonly Place[]): Promise<void>;
}
