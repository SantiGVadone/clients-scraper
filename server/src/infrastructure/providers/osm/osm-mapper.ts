import type { Place } from "../../../domain/place";
import type { OverpassElement } from "./overpass-client";

/** Mapper puro: respuesta externa -> Place. No sabe nada de HTTP. */
export function mapOverpassElements(elements: readonly OverpassElement[]): Place[] {
  const places = new Map<string, Place>();

  for (const element of elements) {
    const tags = element.tags ?? {};
    const name = tags.name?.trim();
    // Sin nombre no hay prospecto útil.
    if (!name) continue;

    const id = `osm:${element.type}/${element.id}`;
    const lat = element.lat ?? element.center?.lat;
    const lng = element.lon ?? element.center?.lon;
    const street = tags["addr:street"];
    const houseNumber = tags["addr:housenumber"];
    const address = [street, houseNumber].filter(Boolean).join(" ") || undefined;

    places.set(id, {
      id,
      source: "osm",
      name,
      ...(address ? { address } : {}),
      ...(lat !== undefined ? { lat } : {}),
      ...(lng !== undefined ? { lng } : {}),
      // OSM no tiene reseñas ni rating: se dejan en undefined, nunca se inventan.
      ...(tags.phone || tags["contact:phone"]
        ? { phone: tags.phone ?? tags["contact:phone"] }
        : {}),
      ...(tags.website || tags["contact:website"]
        ? { website: tags.website ?? tags["contact:website"] }
        : {}),
      mapsUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
    });
  }

  return [...places.values()];
}
