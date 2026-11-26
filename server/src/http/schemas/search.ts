import { z } from "zod";
import type { SearchParams } from "../../domain/search";

const booleanParam = z
  .enum(["true", "false", "1", "0"])
  .transform((value) => value === "true" || value === "1");

export const searchQuerySchema = z.object({
  query: z.string().trim().min(1),
  zone: z.string().trim().min(1),
  limit: z.coerce.number().int().positive().max(500).default(50),
  provider: z.enum(["osm", "google", "auto"]).default("osm"),
  minReviews: z.coerce.number().int().nonnegative().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  hasWebsite: booleanParam.optional(),
  hasPhone: booleanParam.optional(),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;

export function toSearchParams(query: SearchQuery): SearchParams {
  return {
    query: query.query,
    zone: query.zone,
    limit: query.limit,
    provider: query.provider,
    filters: {
      ...(query.minReviews !== undefined ? { minReviews: query.minReviews } : {}),
      ...(query.minRating !== undefined ? { minRating: query.minRating } : {}),
      ...(query.hasWebsite !== undefined ? { hasWebsite: query.hasWebsite } : {}),
      ...(query.hasPhone !== undefined ? { hasPhone: query.hasPhone } : {}),
    },
  };
}
