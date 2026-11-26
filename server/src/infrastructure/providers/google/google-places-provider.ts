import type { PlacesProvider } from "../../../application/ports/places-provider";
import { NotImplementedError } from "../../../domain/errors";

/** Registrado bajo la clave "google", pero no habilitado por defecto. */
export function createGooglePlacesProvider(): PlacesProvider {
  return {
    name: "google",
    capabilities: { reviews: true, rating: true },
    warnings: [],

    async search() {
      throw new NotImplementedError("google");
    },
  };
}
