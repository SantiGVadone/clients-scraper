import { describe, expect, it } from "vitest";
import { applyFilters } from "../../src/domain/filters";
import type { Place } from "../../src/domain/place";

function place(overrides: Partial<Place> = {}): Place {
  return {
    id: "osm:node/1",
    source: "osm",
    name: "Consultorio",
    ...overrides,
  };
}

const places: Place[] = [
  place({
    id: "a",
    name: "Con web y teléfono",
    rating: 4.7,
    reviewCount: 80,
    website: "https://a.com",
    phone: "+54 11 1111",
  }),
  place({
    id: "b",
    name: "Sin web, con teléfono",
    reviewCount: 10,
    phone: "+54 11 2222",
  }),
  place({ id: "c", name: "Sin datos" }),
];

describe("applyFilters", () => {
  it("devuelve todos los lugares cuando no hay filtros", () => {
    expect(applyFilters(places, {})).toHaveLength(3);
  });

  it("filtra por cantidad mínima de reseñas (undefined cuenta como 0)", () => {
    expect(applyFilters(places, { minReviews: 20 }).map((p) => p.id)).toEqual(["a"]);
    expect(applyFilters(places, { minReviews: 0 }).map((p) => p.id)).toEqual(["a", "b", "c"]);
  });

  it("filtra por rating mínimo (undefined cuenta como 0)", () => {
    expect(applyFilters(places, { minRating: 4 }).map((p) => p.id)).toEqual(["a"]);
  });

  it("filtra por presencia de sitio web en ambos sentidos", () => {
    expect(applyFilters(places, { hasWebsite: true }).map((p) => p.id)).toEqual(["a"]);
    expect(applyFilters(places, { hasWebsite: false }).map((p) => p.id)).toEqual(["b", "c"]);
    expect(applyFilters(places, { hasWebsite: undefined })).toHaveLength(3);
  });

  it("filtra por presencia de teléfono en ambos sentidos", () => {
    expect(applyFilters(places, { hasPhone: true }).map((p) => p.id)).toEqual(["a", "b"]);
    expect(applyFilters(places, { hasPhone: false }).map((p) => p.id)).toEqual(["c"]);
  });

  it("combina todos los filtros", () => {
    const result = applyFilters(places, {
      minReviews: 5,
      minRating: undefined,
      hasWebsite: false,
      hasPhone: true,
    });
    expect(result.map((p) => p.id)).toEqual(["b"]);
  });

  it("no muta la entrada y devuelve un array nuevo", () => {
    const original = [...places];
    const result = applyFilters(places, { hasPhone: true });
    expect(result).not.toBe(places);
    expect(places).toEqual(original);
  });
});
