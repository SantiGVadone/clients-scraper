import {
  haversineKm,
  type Coordinate,
  type DistanceFn,
} from "./coordinates";
import { nearestNeighbor, twoOpt } from "./planner";
import type { Place } from "./place";

export interface RouteRequest {
  /** Modelado sin fuente: después puede venir de GPS, clic en el mapa, etc. */
  origin: Coordinate;
  places: readonly Place[];
}

export interface RouteStop {
  place: Place;
  /** Coordenada ya validada: evita volver a chequear lat/lng al armar enlaces. */
  coordinate: Coordinate;
  stop: number;
  distanceFromPreviousKm: number;
}

export interface RouteResult {
  origin: Coordinate;
  ordered: RouteStop[];
  totalDistanceKm: number;
  withoutLocation: Place[];
  warnings: string[];
}

export function hasCoordinates(place: Place): place is Place & Coordinate {
  return (
    typeof place.lat === "number" &&
    Number.isFinite(place.lat) &&
    typeof place.lng === "number" &&
    Number.isFinite(place.lng)
  );
}

/** Orquesta el planner puro: separa sin coordenadas, ordena y calcula distancias. */
export function buildRoute(
  request: RouteRequest,
  distance: DistanceFn = haversineKm,
): RouteResult {
  const located = request.places.filter(hasCoordinates);
  const withoutLocation = request.places.filter((place) => !hasCoordinates(place));

  const initial = nearestNeighbor(request.origin, located, distance);
  const optimized = twoOpt(request.origin, initial, distance);

  let previous: Coordinate = request.origin;
  let totalDistanceKm = 0;
  const ordered = optimized.map((place, index) => {
    const distanceFromPreviousKm = distance(previous, place);
    totalDistanceKm += distanceFromPreviousKm;
    previous = place;
    return {
      place,
      coordinate: { lat: place.lat, lng: place.lng },
      stop: index + 1,
      distanceFromPreviousKm,
    };
  });

  const warnings: string[] = [];
  if (withoutLocation.length > 0) {
    warnings.push(
      `${withoutLocation.length} lugar(es) sin coordenadas no entran en el recorrido; ` +
        'se muestran en "Sin ubicación".',
    );
  }

  return { origin: request.origin, ordered, totalDistanceKm, withoutLocation, warnings };
}
