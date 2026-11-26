import Fastify from "fastify";
import { describe, expect, it } from "vitest";
import { registerErrorHandler } from "../../src/http/error-middleware";
import { createRouteController } from "../../src/http/controllers/route";
import { registerRouteRoutes } from "../../src/http/routes/route";
import { createRouteBodySchema, geocodeQuerySchema } from "../../src/http/schemas/route";

function makeApp() {
  const app = Fastify();
  registerErrorHandler(app);
  registerRouteRoutes(
    app,
    createRouteController({
      geocodeAddress: async (address) => ({ lat: -34.6, lng: -58.9, label: address }),
      maxPlaces: 2,
    }),
  );
  return app;
}

const validBody = {
  origin: { lat: -34.6, lng: -58.9 },
  places: [
    { id: "a", source: "osm", name: "A", lat: -34.61, lng: -58.91 },
    { id: "b", source: "osm", name: "B" },
  ],
};

describe("rutas de recorrido", () => {
  it("POST /api/route responde con paradas, tramos y warnings", async () => {
    const response = await makeApp().inject({
      method: "POST",
      url: "/api/route",
      payload: validBody,
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.provider).toBeUndefined();
    expect(body.ordered).toHaveLength(1);
    expect(body.withoutLocation).toHaveLength(1);
    expect(body.chunks[0].label).toBe("Tramo 1: paradas 1 a 1");
    expect(body.warnings.some((warning: string) => warning.includes("sin coordenadas"))).toBe(true);
  });

  it("GET /api/geocode devuelve el punto del Geocoder inyectado", async () => {
    const response = await makeApp().inject({
      method: "GET",
      url: "/api/geocode?address=Merlo%2C+Buenos+Aires",
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ lat: -34.6, lng: -58.9, label: "Merlo, Buenos Aires" });
  });

  it("rechaza coordenadas fuera de rango y demasiados lugares con 400", async () => {
    const app = makeApp();
    const outOfRange = await app.inject({
      method: "POST",
      url: "/api/route",
      payload: { ...validBody, origin: { lat: 91, lng: 0 } },
    });
    expect(outOfRange.statusCode).toBe(400);
    expect(outOfRange.json().error.code).toBe("VALIDATION_ERROR");

    const tooMany = await app.inject({
      method: "POST",
      url: "/api/route",
      payload: { ...validBody, places: [...validBody.places, ...validBody.places] },
    });
    expect(tooMany.statusCode).toBe(400);
  });

  it("el schema usa mobile por defecto y valida dirección no vacía", () => {
    const parsed = createRouteBodySchema(50).parse(validBody);
    expect(parsed.mode).toBe("mobile");
    expect(geocodeQuerySchema.safeParse({ address: "  " }).success).toBe(false);
  });
});
