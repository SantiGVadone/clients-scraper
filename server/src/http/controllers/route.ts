import type { FastifyRequest } from "fastify";
import type { GeocodedPlace } from "../../application/ports/geocoder";
import type { GeocodeAddress } from "../../application/services/geocode-address";
import { planRoute, type PlanRouteResult } from "../../application/services/plan-route";
import { createRouteBodySchema, geocodeQuerySchema } from "../schemas/route";

export interface RouteController {
  geocode(request: FastifyRequest): Promise<GeocodedPlace>;
  plan(request: FastifyRequest): PlanRouteResult;
}

export function createRouteController(options: {
  geocodeAddress: GeocodeAddress;
  maxPlaces: number;
}): RouteController {
  const bodySchema = createRouteBodySchema(options.maxPlaces);

  return {
    geocode(request) {
      const { address } = geocodeQuerySchema.parse(request.query);
      return options.geocodeAddress(address);
    },
    plan(request) {
      return planRoute(bodySchema.parse(request.body));
    },
  };
}
