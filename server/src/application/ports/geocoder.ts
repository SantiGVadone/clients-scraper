import type { Coordinate } from "../../domain/coordinates";

export interface GeocodedPlace extends Coordinate {
  label: string;
}

export interface Geocoder {
  geocode(address: string): Promise<GeocodedPlace>;
}
