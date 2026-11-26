import type { GeocodedPlace, Geocoder } from "../ports/geocoder";

export interface GeocodeAddress {
  (address: string): Promise<GeocodedPlace>;
}

export function createGeocodeAddress(geocoder: Geocoder): GeocodeAddress {
  return (address) => geocoder.geocode(address);
}
