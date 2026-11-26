import { z } from "zod";

const coordinateSchema = z.object({
  lat: z.number().finite().min(-90).max(90),
  lng: z.number().finite().min(-180).max(180),
});

/** Espejo del Place público: lat/lng opcionales con rango válido. */
const placeSchema = z.object({
  id: z.string().min(1),
  source: z.enum(["google", "osm"]),
  name: z.string().min(1),
  address: z.string().optional(),
  lat: z.number().finite().min(-90).max(90).optional(),
  lng: z.number().finite().min(-180).max(180).optional(),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().nonnegative().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  mapsUrl: z.string().optional(),
  openNow: z.boolean().optional(),
  businessStatus: z.string().optional(),
});

export const geocodeQuerySchema = z.object({
  address: z.string().trim().min(1),
});

/** El tope de lugares es configurable por entorno (default 50). */
export function createRouteBodySchema(maxPlaces: number) {
  return z.object({
    origin: coordinateSchema,
    places: z.array(placeSchema).min(1).max(maxPlaces),
    mode: z.enum(["mobile", "desktop"]).default("mobile"),
  });
}

export type RouteBody = z.infer<ReturnType<typeof createRouteBodySchema>>;
