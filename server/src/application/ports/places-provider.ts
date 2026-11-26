import type { Place, ProviderName } from "../../domain/place";
import type { ProviderCapabilities, SearchParams } from "../../domain/search";

export interface PlacesProvider {
  readonly name: ProviderName;
  readonly capabilities: ProviderCapabilities;
  /** Advertencias propias del proveedor que la API siempre incluye en la respuesta. */
  readonly warnings: readonly string[];

  /**
   * Trae todos los lugares del área. El `limit` se aplica en el service, después
   * de filtrar. Ojo: con Google habrá que revisar esto porque cada página consume cuota.
   */
  search(params: Pick<SearchParams, "query" | "zone">): Promise<Place[]>;
}
