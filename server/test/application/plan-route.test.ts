import { describe, expect, it, vi } from "vitest";
import { createGeocodeAddress } from "../../src/application/services/geocode-address";
import { planRoute } from "../../src/application/services/plan-route";
import type { Place } from "../../src/domain/place";

const place = (id: string, lat?: number, lng?: number): Place => ({
  id,
  source: "osm",
  name: id,
  ...(lat !== undefined ? { lat } : {}),
  ...(lng !== undefined ? { lng } : {}),
});

describe("planRoute", () => {
  it("ordena, separa sin ubicación y arrma tramos mobile", () => {
    const result = planRoute({
      origin: { lat: 0, lng: 0 },
      places: [place("sin"), place("p4", 0, 4), place("p1", 0, 1), place("p3", 0, 3), place("p2", 0, 2)],
      mode: "mobile",
    });

    expect(result.ordered.map((stop) => stop.place.id)).toEqual(["p1", "p2", "p3", "p4"]);
    expect(result.withoutLocation.map((item) => item.id)).toEqual(["sin"]);
    expect(result.chunks).toHaveLength(1);
    expect(result.chunks[0].label).toBe("Tramo 1: paradas 1 a 4");
    expect(result.warnings.some((warning) => warning.includes("sin coordenadas"))).toBe(true);
  });
});

describe("createGeocodeAddress", () => {
  it("delega en el Geocoder inyectado", async () => {
    const geocoder = {
      geocode: vi.fn(async (address: string) => ({
        lat: -34.6,
        lng: -58.9,
        label: address,
      })),
    };
    const geocodeAddress = createGeocodeAddress(geocoder);

    expect(await geocodeAddress("Merlo, Buenos Aires")).toEqual({
      lat: -34.6,
      lng: -58.9,
      label: "Merlo, Buenos Aires",
    });
    expect(geocoder.geocode).toHaveBeenCalledWith("Merlo, Buenos Aires");
  });
});
