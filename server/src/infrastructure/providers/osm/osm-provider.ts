import type { PlacesProvider } from "../../../application/ports/places-provider";
import type { NominatimClient } from "./nominatim-client";
import type { OverpassClient } from "./overpass-client";
import { mapOverpassElements } from "./osm-mapper";
import { getRubroTags } from "./rubros";

/** Los clientes se inyectan para compartir el rate limiter con /api/geocode. */
export function createOsmProvider(options: {
  nominatim: NominatimClient;
  overpass: OverpassClient;
}): PlacesProvider {
  return {
    name: "osm",
    capabilities: { reviews: false, rating: false },
    warnings: [
      "OSM no dispone de reseñas ni rating.",
      "En OSM, 'sin web' significa 'sin web registrada': el negocio podría tener sitio web.",
    ],

    async search({ query, zone }) {
      const bbox = await options.nominatim.geocode(zone);
      const elements = await options.overpass.query(bbox, getRubroTags(query));
      return mapOverpassElements(elements.elements);
    },
  };
}
