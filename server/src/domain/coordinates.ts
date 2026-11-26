/** Punto geográfico simple, sin importar de dónde vine (dirección, mapa, GPS...). */
export interface Coordinate {
  lat: number;
  lng: number;
}

/** Inyectable para poder cambiar a distancias por calles sin reescribir el planner. */
export type DistanceFn = (from: Coordinate, to: Coordinate) => number;

const EARTH_RADIUS_KM = 6371.0088;

export function haversineKm(from: Coordinate, to: Coordinate): number {
  const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const deltaLat = lat2 - lat1;
  const deltaLng = toRadians(to.lng - from.lng);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}
