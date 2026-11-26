import type { GeocodedPlace, Geocoder } from "../../application/ports/geocoder";
import type { NominatimClient } from "../providers/osm/nominatim-client";

/** Adaptador: el puerto Geocoder no sabe que detrás está Nominatim. */
export function createNominatimGeocoder(client: NominatimClient): Geocoder {
  return {
    geocode(address: string): Promise<GeocodedPlace> {
      return client.geocodePoint(address);
    },
  };
}
