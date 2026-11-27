import { describe, expect, it, vi } from "vitest";
import { QuotaExceededError } from "../../src/domain/errors";
import { createGooglePlacesProvider } from "../../src/infrastructure/providers/google/google-places-provider";

const baseOptions = {
  apiKey: "clave-de-prueba",
  languageCode: "es",
  regionCode: "AR",
  maxPages: 3,
  maxRequestsPerDay: 30,
};

function fakeClient(
  pages: Array<{
    places: Array<{ id: string; displayName?: { text?: string } }>;
    nextPageToken?: string;
  }>,
) {
  let call = 0;
  const searchText = vi.fn(async (_textQuery: string, _pageToken?: string) => {
    const page = pages[Math.min(call, pages.length - 1)];
    call += 1;
    return page;
  });
  return { client: { searchText }, searchText };
}

describe("GooglePlacesProvider", () => {
  it("pide páginas encadenadas, deduplica y mantiene las capabilities", async () => {
    const { client, searchText } = fakeClient([
      {
        places: [
          { id: "p1", displayName: { text: "Uno" } },
          { id: "p2", displayName: { text: "Dos" } },
        ],
        nextPageToken: "t2",
      },
      {
        places: [
          { id: "p2", displayName: { text: "Dos repetido" } },
          { id: "p3", displayName: { text: "Tres" } },
        ],
      },
    ]);
    const provider = createGooglePlacesProvider({ ...baseOptions, client });

    const results = await provider.search({ query: "dentista", zone: "Merlo, Buenos Aires" });

    expect(provider.name).toBe("google");
    expect(provider.capabilities).toEqual({ reviews: true, rating: true });
    expect(results.map((place) => place.id)).toEqual(["p1", "p2", "p3"]);
    expect(searchText).toHaveBeenCalledTimes(2);
    expect(searchText.mock.calls[0][0]).toBe("dentista Merlo, Buenos Aires");
    expect(searchText.mock.calls[1][1]).toBe("t2");
  });

  it("se detiene en maxPages aunque siga habiendo nextPageToken", async () => {
    const { client, searchText } = fakeClient([
      { places: [{ id: "p1" }], nextPageToken: "t2" },
      { places: [{ id: "p2" }], nextPageToken: "t3" },
    ]);
    const provider = createGooglePlacesProvider({ ...baseOptions, maxPages: 1, client });

    expect(await provider.search({ query: "q", zone: "z" })).toHaveLength(1);
    expect(searchText).toHaveBeenCalledTimes(1);
  });

  it("falla con QuotaExceededError antes de pasar el cupo local", async () => {
    const { client, searchText } = fakeClient([
      { places: [{ id: "p1" }], nextPageToken: "t2" },
      { places: [{ id: "p2" }] },
    ]);
    const provider = createGooglePlacesProvider({
      ...baseOptions,
      maxRequestsPerDay: 1,
      client,
    });

    await expect(provider.search({ query: "q", zone: "z" })).rejects.toBeInstanceOf(
      QuotaExceededError,
    );
    expect(searchText).toHaveBeenCalledTimes(1);
  });
});
