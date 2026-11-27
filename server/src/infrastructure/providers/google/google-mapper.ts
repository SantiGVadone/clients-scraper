import type { Place } from "../../../domain/place";
import type { GooglePlace } from "./google-client";

/** Google Place (New) -> Place común. Deduplica por id y no inventa horarios. */
export function mapGooglePlaces(places: readonly GooglePlace[]): Place[] {
  const seen = new Set<string>();
  const mapped: Place[] = [];

  for (const place of places) {
    if (!place.id || seen.has(place.id)) continue;
    seen.add(place.id);

    const lat = place.location?.latitude;
    const lng = place.location?.longitude;
    mapped.push({
      id: place.id,
      source: "google",
      name: place.displayName?.text ?? place.id,
      ...(place.formattedAddress ? { address: place.formattedAddress } : {}),
      ...(typeof lat === "number" ? { lat } : {}),
      ...(typeof lng === "number" ? { lng } : {}),
      ...(typeof place.rating === "number" ? { rating: place.rating } : {}),
      ...(typeof place.userRatingCount === "number" ? { reviewCount: place.userRatingCount } : {}),
      ...(place.nationalPhoneNumber ? { phone: place.nationalPhoneNumber } : {}),
      ...(place.websiteUri ? { website: place.websiteUri } : {}),
      ...(place.googleMapsUri ? { mapsUrl: place.googleMapsUri } : {}),
      ...(place.businessStatus ? { businessStatus: place.businessStatus } : {}),
    });
  }

  return mapped;
}
