import { describe, expect, it } from "vitest";
import { mapGooglePlaces } from "../../src/infrastructure/providers/google/google-mapper";
import fixture from "./__fixtures__/google-text-search.json";

describe("mapGooglePlaces", () => {
  it("mapea campos, deduplica por id y no inventa horarios", () => {
    const places = mapGooglePlaces(fixture.places);

    expect(places).toHaveLength(2);
    expect(places[0]).toMatchObject({
      id: "google-place-1",
      source: "google",
      name: "Dentista Ejemplo",
      address: "Av. Sarmiento 1234, Merlo, Buenos Aires",
      lat: -34.658,
      lng: -58.925,
      rating: 4.7,
      reviewCount: 123,
      phone: "3512345678",
      website: "https://dentista-ejemplo.com.ar",
      mapsUrl: "https://maps.google.com/?cid=1",
      businessStatus: "OPERATIONAL",
    });
    expect(places[0].openNow).toBeUndefined();

    expect(places[1]).toMatchObject({
      id: "google-place-2",
      name: "Consultorio sin web",
      address: "Calle Falsa 123, Merlo, Buenos Aires",
    });
    expect(places[1].rating).toBeUndefined();
    expect(places[1].reviewCount).toBeUndefined();
    expect(places[1].website).toBeUndefined();
    expect(places[1].phone).toBeUndefined();
    expect(places[1].lat).toBeUndefined();
  });
});
