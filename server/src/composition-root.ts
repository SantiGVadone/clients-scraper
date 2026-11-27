import { resolve } from "node:path";
import Fastify, { type FastifyInstance } from "fastify";
import { createSearchPlaces } from "./application/services/search-places";
import { createExportPlaces } from "./application/services/export-places";
import { createGeocodeAddress } from "./application/services/geocode-address";
import type { PlacesProvider } from "./application/ports/places-provider";
import type { ProviderName } from "./domain/place";
import type { ProviderDescriptor } from "./domain/search";
import { env } from "./config/env";
import { createFileCache } from "./infrastructure/cache/file-cache";
import { serializeCsv } from "./infrastructure/csv/csv-exporter";
import { createNominatimGeocoder } from "./infrastructure/geocoding/nominatim-geocoder";
import { createGooglePlacesProvider } from "./infrastructure/providers/google/google-places-provider";
import { createNominatimClient } from "./infrastructure/providers/osm/nominatim-client";
import { createOverpassClient } from "./infrastructure/providers/osm/overpass-client";
import { createOsmProvider } from "./infrastructure/providers/osm/osm-provider";
import { registerErrorHandler } from "./http/error-middleware";
import { createRouteController } from "./http/controllers/route";
import { createSearchController } from "./http/controllers/search";
import { registerProvidersRoute } from "./http/routes/providers";
import { registerRouteRoutes } from "./http/routes/route";
import { registerSearchRoutes } from "./http/routes/search";

/** Único lugar donde se elige qué provider se usa por defecto y cuáles están activos. */
const DEFAULT_PROVIDER: ProviderName = "osm";
const ENABLED_PROVIDERS: readonly ProviderName[] = env.GOOGLE_PLACES_API_KEY
  ? ["osm", "google"]
  : ["osm"];

export function createApp(): FastifyInstance {
  // Un solo cliente Nominatim: /api/search y /api/geocode comparten el límite de 1 req/s.
  const nominatim = createNominatimClient({ userAgent: env.OSM_USER_AGENT });
  const overpass = createOverpassClient({ userAgent: env.OSM_USER_AGENT });

  const providers: Record<ProviderName, PlacesProvider> = {
    osm: createOsmProvider({ nominatim, overpass }),
    google: createGooglePlacesProvider({
      apiKey: env.GOOGLE_PLACES_API_KEY,
      languageCode: env.GOOGLE_LANGUAGE_CODE,
      regionCode: env.GOOGLE_REGION_CODE,
      maxPages: env.GOOGLE_MAX_PAGES,
      maxRequestsPerDay: env.GOOGLE_MAX_REQUESTS_PER_DAY,
    }),
  };

  const descriptors: ProviderDescriptor[] = (Object.keys(providers) as ProviderName[]).map(
    (name) => ({
      name,
      enabled: ENABLED_PROVIDERS.includes(name),
      capabilities: providers[name].capabilities,
    }),
  );

  const cache = createFileCache({
    directory: resolve(process.cwd(), ".cache"),
    ttlHours: env.CACHE_TTL_HOURS,
  });

  const searchPlaces = createSearchPlaces({ providers, cache, defaultProvider: DEFAULT_PROVIDER });
  const exportPlaces = createExportPlaces({ searchPlaces, serializeCsv });
  const controller = createSearchController({ searchPlaces, exportPlaces, providers: descriptors });
  const geocodeAddress = createGeocodeAddress(createNominatimGeocoder(nominatim));
  const routeController = createRouteController({
    geocodeAddress,
    maxPlaces: env.ROUTE_MAX_PLACES,
  });

  const app = Fastify({ logger: true });
  registerErrorHandler(app);
  registerSearchRoutes(app, controller);
  registerProvidersRoute(app, controller);
  registerRouteRoutes(app, routeController);
  return app;
}
