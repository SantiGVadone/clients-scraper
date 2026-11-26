import type { Coordinate } from "../../domain/coordinates";
import type { Place } from "../../domain/place";
import { buildRoute, type RouteResult } from "../../domain/route";
import { buildRouteLinks, type RouteChunk, type RouteMode } from "./route-links";

export interface PlanRouteInput {
  origin: Coordinate;
  places: readonly Place[];
  mode: RouteMode;
}

export interface PlanRouteResult extends RouteResult {
  chunks: RouteChunk[];
}

/** Función pura de aplicación: orquesta el planner y la generación de enlaces. */
export function planRoute(input: PlanRouteInput): PlanRouteResult {
  const route = buildRoute({ origin: input.origin, places: input.places });
  const links = buildRouteLinks(input.origin, route.ordered, input.mode);

  return {
    ...route,
    chunks: links.chunks,
    warnings: [...route.warnings, ...links.warnings],
  };
}
