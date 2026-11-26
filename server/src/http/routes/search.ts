import type { FastifyInstance } from "fastify";
import type { SearchController } from "../controllers/search";

export function registerSearchRoutes(app: FastifyInstance, controller: SearchController): void {
  app.get("/api/search", async (request) => controller.search(request));

  app.get("/api/search/export.csv", async (request, reply) => {
    const { csv, warnings } = await controller.exportCsv(request);
    if (warnings.length > 0) {
      reply.header("X-ClientsScraper-Warnings", warnings.map(encodeURIComponent).join(";"));
    }
    reply.header("Content-Type", "text/csv; charset=utf-8");
    reply.header("Content-Disposition", 'attachment; filename="clientscraper.csv"');
    return reply.send(csv);
  });
}
