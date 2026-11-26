import type { FastifyInstance } from "fastify";
import type { SearchController } from "../controllers/search";

export function registerProvidersRoute(app: FastifyInstance, controller: SearchController): void {
  app.get("/api/providers", async () => controller.providers());
}
