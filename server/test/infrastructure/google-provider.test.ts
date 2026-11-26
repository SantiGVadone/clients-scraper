import { describe, expect, it } from "vitest";
import { NotImplementedError } from "../../src/domain/errors";
import { createGooglePlacesProvider } from "../../src/infrastructure/providers/google/google-places-provider";

describe("GooglePlacesProvider (stub)", () => {
  it("implementa el port pero falla con un error de dominio claro", async () => {
    const provider = createGooglePlacesProvider();
    expect(provider.name).toBe("google");
    expect(provider.capabilities).toEqual({ reviews: true, rating: true });
    await expect(provider.search({ query: "dentista", zone: "Merlo" })).rejects.toBeInstanceOf(
      NotImplementedError,
    );
    await expect(provider.search({ query: "dentista", zone: "Merlo" })).rejects.toThrow(
      /todavía no está implementado/,
    );
  });
});
