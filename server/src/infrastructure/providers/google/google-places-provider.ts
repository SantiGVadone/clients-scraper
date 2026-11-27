import type { PlacesProvider } from "../../../application/ports/places-provider";
import { QuotaExceededError } from "../../../domain/errors";
import { createGoogleClient, type GoogleClient, type GooglePlace } from "./google-client";
import { mapGooglePlaces } from "./google-mapper";

/** Provider de Google Places (New). Se habilita desde el composition root. */
export function createGooglePlacesProvider(options: {
  apiKey: string;
  languageCode: string;
  regionCode: string;
  maxPages: number;
  maxRequestsPerDay: number;
  client?: GoogleClient;
}): PlacesProvider {
  const client =
    options.client ??
    createGoogleClient({
      apiKey: options.apiKey,
      languageCode: options.languageCode,
      regionCode: options.regionCode,
    });
  let requestsUsed = 0;

  return {
    name: "google",
    capabilities: { reviews: true, rating: true },
    warnings: [],

    async search({ query, zone }) {
      const textQuery = `${query.trim()} ${zone.trim()}`.trim();
      const raw: GooglePlace[] = [];
      let pageToken: string | undefined;

      for (let page = 0; page < options.maxPages; page += 1) {
        if (requestsUsed >= options.maxRequestsPerDay) {
          throw new QuotaExceededError("google");
        }
        requestsUsed += 1;

        const response = await client.searchText(textQuery, pageToken);
        raw.push(...response.places);
        pageToken = response.nextPageToken;
        if (!pageToken) break;
      }

      return mapGooglePlaces(raw);
    },
  };
}
