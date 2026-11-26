import { haversineKm, type Coordinate, type DistanceFn } from "./coordinates";

/** Vecino más cercano: origen fijo, camino abierto, última parada libre. */
export function nearestNeighbor<T extends Coordinate>(
  origin: Coordinate,
  places: readonly T[],
  distance: DistanceFn = haversineKm,
): T[] {
  const remaining = [...places];
  const route: T[] = [];
  let current: Coordinate = origin;

  while (remaining.length > 0) {
    let bestIndex = 0;
    let bestDistance = distance(current, remaining[0]);

    for (let index = 1; index < remaining.length; index += 1) {
      const candidate = distance(current, remaining[index]);
      if (candidate < bestDistance) {
        bestDistance = candidate;
        bestIndex = index;
      }
    }

    const [next] = remaining.splice(bestIndex, 1);
    route.push(next);
    current = next;
  }

  return route;
}

/**
 * 2-opt sobre un camino abierto. `j` llega hasta la última parada: invertir un
 * segmento que incluye la última es válido y cambia cuál queda al final.
 */
export function twoOpt<T extends Coordinate>(
  origin: Coordinate,
  path: readonly T[],
  distance: DistanceFn = haversineKm,
): T[] {
  let best = [...path];
  let bestLength = routeLength(origin, best, distance);
  let improved = true;

  while (improved) {
    improved = false;

    for (let i = 0; i < best.length - 1; i += 1) {
      for (let j = i + 1; j < best.length; j += 1) {
        const candidate = [...best];
        reverse(candidate, i, j);
        const length = routeLength(origin, candidate, distance);

        if (length + 1e-9 < bestLength) {
          best = candidate;
          bestLength = length;
          improved = true;
        }
      }
    }
  }

  return best;
}

export function routeLength<T extends Coordinate>(
  origin: Coordinate,
  path: readonly T[],
  distance: DistanceFn = haversineKm,
): number {
  let previous: Coordinate = origin;
  let total = 0;
  for (const place of path) {
    total += distance(previous, place);
    previous = place;
  }
  return total;
}

function reverse<T>(items: T[], from: number, to: number): void {
  while (from < to) {
    [items[from], items[to]] = [items[to], items[from]];
    from += 1;
    to -= 1;
  }
}
