import { ProviderUnavailableError, QuotaExceededError } from "../../../domain/errors";
import type { FetchFn } from "../../fetch";

/** Campos mínimos para mantener las capabilities declaradas (reviews y rating). */
export const GOOGLE_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.googleMapsUri",
  "places.businessStatus",
  "places.rating",
  "places.userRatingCount",
  "places.websiteUri",
  "places.nationalPhoneNumber",
  "nextPageToken",
].join(",");

export interface GooglePlace {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  googleMapsUri?: string;
  businessStatus?: string;
  rating?: number;
  userRatingCount?: number;
  websiteUri?: string;
  nationalPhoneNumber?: string;
}

interface GoogleTextSearchBody {
  places?: GooglePlace[];
  nextPageToken?: string;
}

export interface GoogleSearchPage {
  places: GooglePlace[];
  nextPageToken?: string;
}

export interface GoogleClient {
  searchText(textQuery: string, pageToken?: string): Promise<GoogleSearchPage>;
}

/** Cliente HTTP de Places API (New), con fetch inyectable para los tests. */
export function createGoogleClient(options: {
  apiKey: string;
  languageCode: string;
  regionCode: string;
  fetchFn?: FetchFn;
}): GoogleClient {
  const fetchFn = options.fetchFn ?? fetch;

  return {
    async searchText(textQuery, pageToken) {
      const response = await fetchFn("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": options.apiKey,
          "X-Goog-FieldMask": GOOGLE_FIELD_MASK,
        },
        body: JSON.stringify({
          textQuery,
          languageCode: options.languageCode,
          regionCode: options.regionCode,
          pageSize: 20,
          ...(pageToken ? { pageToken } : {}),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        if (response.status === 429) {
          throw new QuotaExceededError("google");
        }
        throw new ProviderUnavailableError("google", {
          cause: new Error(payload?.error?.message ?? `HTTP ${response.status}`),
        });
      }

      const body = (await response.json()) as GoogleTextSearchBody;
      return { places: body.places ?? [], nextPageToken: body.nextPageToken };
    },
  };
}
