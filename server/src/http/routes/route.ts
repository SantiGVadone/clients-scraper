import type { FastifyInstance } from "fastify";
import type { RouteController } from "../controllers/route";

export function registerRouteRoutes(app: FastifyInstance, controller: RouteController): void {
  app.get("/api/geocode", async (request) => controller.geocode(request));
  app.post("/api/route", async (request) => controller.plan(request));
}
