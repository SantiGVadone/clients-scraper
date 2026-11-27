import { resolve } from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

// El .env puede estar en la raíz del monorepo o en server/.
dotenv.config({ path: resolve(process.cwd(), "..", ".env") });
dotenv.config();

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  CACHE_TTL_HOURS: z.coerce.number().positive().default(24),
  ROUTE_MAX_PLACES: z.coerce.number().int().positive().default(50),
  OSM_USER_AGENT: z
    .string()
    .min(1)
    .default("ClientsScraper/0.1 (dev; configurar OSM_USER_AGENT en .env)"),
  GOOGLE_PLACES_API_KEY: z.string().default(""),
  GOOGLE_LANGUAGE_CODE: z.string().min(2).default("es"),
  GOOGLE_REGION_CODE: z.string().length(2).default("AR"),
  GOOGLE_MAX_PAGES: z.coerce.number().int().positive().default(3),
  GOOGLE_MAX_REQUESTS_PER_DAY: z.coerce.number().int().positive().default(30),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Configuración inválida: ${parsed.error.issues.map((i) => i.message).join("; ")}`);
}

export const env = parsed.data;
