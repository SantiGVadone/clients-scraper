import { describe, expect, it } from "vitest";
import { mapOverpassElements } from "../../src/infrastructure/providers/osm/osm-mapper";
import type { OverpassResponse } from "../../src/infrastructure/providers/osm/overpass-client";
import fixture from "./__fixtures__/overpass-response.json";

const response = fixture as unknown as OverpassResponse;

describe("mapOverpassElements", () => {
  const places = mapOverpassElements(response.elements);

  it("mapea nodos con_center y tags simples", () => {
    expect(places[0]).toMatchObject({
      id: "osm:node/123456789",
      source: "osm",
      name: "Dentista Centro",
      lat: -34.6581234,
      lng: -58.9256789,
      phone: "+54 11 4455 6677",
      website: "https://dentistacentro.com.ar",
      address: "Av. Libertador 1234",
      mapsUrl: "https://www.openstreetmap.org/node/123456789",
    });
  });

  it("usa center para vías y lee los tags contact:*", () => {
    expect(places[1]).toMatchObject({
      id: "osm:way/987654321",
      name: "Clínica Dental Merlo",
      lat: -34.6612345,
      lng: -58.9312345,
      phone: "+54 11 2233 4455",
      website: "clinicadentalmerlo.com.ar",
      address: "Calle Sarmiento",
    });
  });

  it("mapea relaciones y deja rating/reviewCount en undefined", () => {
    expect(places[2]).toMatchObject({ id: "osm:relation/5555555", source: "osm" });
    expect(places[2].rating).toBeUndefined();
    expect(places[2].reviewCount).toBeUndefined();
    expect(places[2].phone).toBeUndefined();
    expect(places[2].website).toBeUndefined();
  });

  it("descarta elementos sin nombre", () => {
    expect(places).toHaveLength(4);
    expect(places.map((p) => p.id)).not.toContain("osm:node/111111111");
  });

  it("no muta los elementos originales", () => {
    const before = JSON.stringify(response.elements);
    mapOverpassElements(response.elements);
    expect(JSON.stringify(response.elements)).toBe(before);
  });
});
