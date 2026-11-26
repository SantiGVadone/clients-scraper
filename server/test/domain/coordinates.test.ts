import { describe, expect, it } from "vitest";
import { haversineKm } from "../../src/domain/coordinates";

describe("haversineKm", () => {
  it("devuelve 0 para el mismo punto", () => {
    expect(haversineKm({ lat: -34.6, lng: -58.9 }, { lat: -34.6, lng: -58.9 })).toBe(0);
  });

  it("un grado de latitud o longitud en el ecuador mide ~111,19 km", () => {
    const origin = { lat: 0, lng: 0 };
    expect(haversineKm(origin, { lat: 1, lng: 0 })).toBeCloseTo(111.195, 2);
    expect(haversineKm(origin, { lat: 0, lng: 1 })).toBeCloseTo(111.195, 2);
  });

  it("es simétrica", () => {
    const a = { lat: -34.658, lng: -58.925 };
    const b = { lat: -34.671, lng: -58.94 };
    expect(haversineKm(a, b)).toBeCloseTo(haversineKm(b, a), 9);
  });
});
