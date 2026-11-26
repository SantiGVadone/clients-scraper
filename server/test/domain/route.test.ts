import { describe, expect, it } from "vitest";
import type { Place } from "../../src/domain/place";
import { buildRoute } from "../../src/domain/route";

const place = (id: string, lat?: number, lng?: number): Place => ({
  id,
  source: "osm",
  name: id,
  ...(lat !== undefined ? { lat } : {}),
  ...(lng !== undefined ? { lng } : {}),
});

describe("buildRoute", () => {
  const origin = { lat: 0, lng: 0 };

  it("numera paradas, calcula tramos y separa los lugares sin coordenadas", () => {
    const result = buildRoute({
      origin,
      places: [
        place("sin1"),
        place("lejos", 0, 10),
        place("cerca", 0, 1),
        place("sin2", undefined, 5),
        place("medio", 0, 5),
      ],
    });

    expect(result.ordered.map((stop) => stop.place.id)).toEqual([
      "cerca",
      "medio",
      "lejos",
    ]);
    expect(result.ordered.map((stop) => stop.stop)).toEqual([1, 2, 3]);
    expect(result.ordered[0].coordinate).toEqual({ lat: 0, lng: 1 });
    expect(result.ordered[0].distanceFromPreviousKm).toBeCloseTo(111.195, 2);
    expect(result.totalDistanceKm).toBeCloseTo(
      result.ordered.reduce((sum, stop) => sum + stop.distanceFromPreviousKm, 0),
      8,
    );
    expect(result.withoutLocation.map((item) => item.id)).toEqual(["sin1", "sin2"]);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("sin coordenadas");
  });

  it("acepta una función de distancia inyectada", () => {
    const result = buildRoute(
      { origin, places: [place("a", 0, 1), place("b", 0, 2)] },
      () => 7,
    );

    expect(result.totalDistanceKm).toBe(14);
    expect(result.ordered.map((stop) => stop.distanceFromPreviousKm)).toEqual([7, 7]);
    expect(result.warnings).toEqual([]);
  });

  it("devuelve un recorrido vacío si no hay lugares con coordenadas", () => {
    const result = buildRoute({ origin, places: [place("sin1"), place("sin2")] });
    expect(result.ordered).toEqual([]);
    expect(result.totalDistanceKm).toBe(0);
    expect(result.withoutLocation).toHaveLength(2);
  });
});
