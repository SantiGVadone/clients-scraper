import { UnknownRubroError } from "../../../domain/errors";

/**
 * Cada rubro se traduce a una lista de filtros OSM. Un filtro es un array de
 * tokens: los dos primeros son key/value exactos; los demás admiten
 * `key=valor1|valor2` para matchear varias opciones.
 */
export const RUBROS_OSM: Record<string, string[][]> = {
  dentista: [
    ["amenity", "dentist"],
    ["healthcare", "dentist"],
  ],
  farmacia: [["amenity", "pharmacy"]],
  restaurante: [["amenity", "restaurant"]],
  gimnasio: [["leisure", "fitness_centre"]],
  "cancha de futbol": [
    ["leisure", "pitch", "sport=soccer|football"],
    ["leisure", "sports_centre", "sport=soccer|football"],
  ],
  panaderia: [["shop", "bakery"]],
  carniceria: [["shop", "butcher"]],
  peluqueria: [["shop", "hairdresser"]],
  veterinaria: [["amenity", "veterinary"]],
  "taller mecanico": [["shop", "car_repair"]],
  cafe: [["amenity", "cafe"]],
  supermercado: [["shop", "supermarket"]],
};

/** Acepta "Cancha de Fútbol", "dentista " etc. sin depender de mayúsculas ni tildes. */
export function normalizarRubro(query: string): string {
  return query
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .trim()
    .replace(/\s+/g, " ");
}

export function getRubroTags(query: string): string[][] {
  const rubro = normalizarRubro(query);
  const tags = RUBROS_OSM[rubro];
  if (!tags) {
    throw new UnknownRubroError(Object.keys(RUBROS_OSM).sort());
  }
  return tags;
}
