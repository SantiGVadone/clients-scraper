import { describe, expect, it } from "vitest";
import type { Coordinate } from "../../src/domain/coordinates";
import { nearestNeighbor, routeLength, twoOpt } from "../../src/domain/planner";

interface Node extends Coordinate {
  id: string;
}

const node = (id: string, lng: number, lat = 0): Node => ({ id, lat, lng });
const origin: Coordinate = { lat: 0, lng: 0 };
const ids = (path: readonly Node[]): string[] => path.map((item) => item.id);

describe("nearestNeighbor", () => {
  it("empieza por la parada más cercana y sigue desde ahí", () => {
    const points = [node("lejos", 10), node("cerca", 2), node("medio", 5)];
    expect(ids(nearestNeighbor(origin, points))).toEqual(["cerca", "medio", "lejos"]);
  });

  it("usa la función de distancia inyectada", () => {
    const points = [node("a", 10), node("b", 2), node("c", 5)];
    // Todas las distancias son iguales: se conserva el orden de entrada.
    expect(ids(nearestNeighbor(origin, points, () => 1))).toEqual(["a", "b", "c"]);
  });

  it("no muta la entrada", () => {
    const points = [node("a", 3), node("b", 1)];
    const copy = [...points];
    nearestNeighbor(origin, points);
    expect(points).toEqual(copy);
  });
});

describe("twoOpt", () => {
  it("invierte un segmento que incluye la última parada y cambia la final", () => {
    // Camino abierto: O(0) -> A(1) -> B(5) -> C(2).
    // Invertir [B,C] deja O -> A -> C -> B: más corto y la última pasa a ser B.
    const path = [node("A", 1), node("B", 5), node("C", 2)];
    const before = routeLength(origin, path);
    const after = twoOpt(origin, path);

    expect(ids(after)).toEqual(["A", "C", "B"]);
    expect(after.at(-1)?.id).toBe("B");
    expect(routeLength(origin, after)).toBeLessThan(before);
    expect(ids(path)).toEqual(["A", "B", "C"]);
  });

  it("usa la función de distancia inyectada", () => {
    const path = [node("A", 1), node("B", 5), node("C", 2)];
    const manhattanish = (a: Coordinate, b: Coordinate): number =>
      Math.abs(a.lat - b.lat) + Math.abs(a.lng - b.lng);
    expect(ids(twoOpt(origin, path, manhattanish))).toEqual(["A", "C", "B"]);
  });

  it("nunca devuelve un recorrido más largo que el vecino más cercano", () => {
    let seed = 42;
    const random = (): number => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    for (let sample = 0; sample < 40; sample += 1) {
      const count = 2 + (sample % 9);
      const points = Array.from({ length: count }, (_, index) =>
        node(`p${index}`, random() * 2, random() * 2),
      );
      const greedy = nearestNeighbor(origin, points);
      const optimized = twoOpt(origin, greedy);
      expect(routeLength(origin, optimized)).toBeLessThanOrEqual(
        routeLength(origin, greedy) + 1e-9,
      );
    }
  });
});
