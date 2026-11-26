import { describe, expect, it } from "vitest";
import { ZoneNotFoundError, QuotaExceededError } from "../../src/domain/errors";
import { createNominatimClient } from "../../src/infrastructure/providers/osm/nominatim-client";
import {
  buildOverpassQuery,
  createOverpassClient,
} from "../../src/infrastructure/providers/osm/overpass-client";
import { getRubroTags, normalizarRubro } from "../../src/infrastructure/providers/osm/rubros";
import type { FetchFn } from "../../src/infrastructure/fetch";

const bbox = { south: -34.7, west: -58.95, north: -34.6, east: -58.9 };

describe("rubros OSM", () => {
  it("normaliza tildes, mayúsculas y espacios", () => {
    expect(normalizarRubro("  Cancha de Fútbol ")).toBe("cancha de futbol");
    expect(getRubroTags("Cancha de Fútbol")).toEqual([
      ["leisure", "pitch", "sport=soccer|football"],
      ["leisure", "sports_centre", "sport=soccer|football"],
    ]);
  });

  it("incluye los rubros pedidos y falla con lista si no existe", () => {
    for (const rubro of ["dentista", "farmacia", "restaurante", "gimnasio"]) {
      expect(getRubroTags(rubro).length).toBeGreaterThan(0);
    }
    expect(() => getRubroTags("panadería")).not.toThrow();
    expect(() => getRubroTags("rubro inventado")).toThrow(/Rubros disponibles/);
  });
});

describe("buildOverpassQuery", () => {
  it("arma nwr con bbox y out center tags", () => {
    const query = buildOverpassQuery(bbox, getRubroTags("dentista"));
    expect(query).toContain('nwr["amenity"="dentist"](-34.7,-58.95,-34.6,-58.9);');
    expect(query).toContain('nwr["healthcare"="dentist"]');
    expect(query.endsWith("out center tags;")).toBe(true);
  });

  it("convierte valores alternativos en regex", () => {
    const query = buildOverpassQuery(bbox, getRubroTags("cancha de futbol"));
    expect(query).toContain('["sport"~"^(soccer|football)$"]');
  });
});

describe("createNominatimClient", () => {
  it("geocodifica con User-Agent sin pegarle a la red", async () => {
    let requestedUrl = "";
    let userAgent: string | undefined;
    const fetchFn: FetchFn = async (url, init) => {
      requestedUrl = url;
      userAgent = (init?.headers as Record<string, string>)["User-Agent"];
      return Response.json([{ boundingbox: ["-34.7", "-34.6", "-58.95", "-58.9"] }]);
    };

    const client = createNominatimClient({
      userAgent: "ClientsScraper/0.1 (test@example.com)",
      minIntervalMs: 0,
      fetchFn,
    });
    expect(await client.geocode("Merlo, Buenos Aires")).toEqual(bbox);
    expect(requestedUrl).toContain("q=Merlo%2C+Buenos+Aires");
    expect(userAgent).toBe("ClientsScraper/0.1 (test@example.com)");
  });

  it("geocodifica una dirección a punto con label", async () => {
    const fetchFn: FetchFn = async () =>
      Response.json([
        { lat: "-34.658", lon: "-58.925", display_name: "Merlo, Buenos Aires, Argentina" },
      ]);
    const client = createNominatimClient({
      userAgent: "test",
      minIntervalMs: 0,
      fetchFn,
    });

    expect(await client.geocodePoint("Merlo, Buenos Aires")).toEqual({
      lat: -34.658,
      lng: -58.925,
      label: "Merlo, Buenos Aires, Argentina",
    });
  });

  it("traduce zona no encontrada y 429 a errores de dominio", async () => {
    const empty: FetchFn = async () => Response.json([]);
    const limited: FetchFn = async () => new Response("", { status: 429 });

    await expect(
      createNominatimClient({ userAgent: "test", minIntervalMs: 0, fetchFn: empty }).geocode("x"),
    ).rejects.toBeInstanceOf(ZoneNotFoundError);
    await expect(
      createNominatimClient({ userAgent: "test", minIntervalMs: 0, fetchFn: limited }).geocode("x"),
    ).rejects.toBeInstanceOf(QuotaExceededError);
  });
});

describe("createOverpassClient", () => {
  it("envía la query por POST y devuelve los elementos", async () => {
    let body = "";
    const fetchFn: FetchFn = async (_url, init) => {
      body = String(init?.body ?? "");
      return Response.json({ elements: [{ type: "node", id: 1, tags: { name: "A" } }] });
    };

    const client = createOverpassClient({ fetchFn });
    const result = await client.query(bbox, getRubroTags("dentista"));
    expect(result.elements).toHaveLength(1);
    expect(decodeURIComponent(body.replace(/\+/g, " "))).toContain("out center tags");
  });
});
