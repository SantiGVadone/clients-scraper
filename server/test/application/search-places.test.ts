import { describe, expect, it, vi } from "vitest";
import { createSearchPlaces } from "../../src/application/services/search-places";
import type { PlacesProvider } from "../../src/application/ports/places-provider";
import type { SearchCache } from "../../src/application/ports/search-cache";
import type { Place, ProviderName } from "../../src/domain/place";
import type { SearchParams } from "../../src/domain/search";

const places: Place[] = [
  { id: "a", source: "osm", name: "A", phone: "+54 11 1111", website: "https://a.com" },
  { id: "b", source: "osm", name: "B", phone: "+54 11 2222" },
  { id: "c", source: "osm", name: "C" },
];

function makeProvider(name: ProviderName, overrides: Partial<PlacesProvider> = {}): PlacesProvider {
  const search = vi.fn(async () => places);
  return {
    name,
    capabilities: { reviews: false, rating: false },
    warnings: [`aviso de ${name}`],
    search,
    ...overrides,
  };
}

function makeCache() {
  const store = new Map<string, Place[]>();
  const cache: SearchCache = {
    get: vi.fn(async (key: string) => store.get(key)),
    set: vi.fn(async (key: string, value: readonly Place[]) => {
      store.set(key, [...value]);
    }),
  };
  return { cache, store };
}

function params(overrides: Partial<SearchParams> = {}): SearchParams {
  return {
    query: "dentista",
    zone: "Merlo, Buenos Aires",
    limit: 50,
    provider: "osm",
    filters: {},
    ...overrides,
  };
}

describe("createSearchPlaces", () => {
  it("llama al provider en cache miss y guarda resultados crudos", async () => {
    const provider = makeProvider("osm");
    const { cache } = makeCache();
    const search = createSearchPlaces({
      providers: { osm: provider, google: makeProvider("google") },
      cache,
      defaultProvider: "osm",
    });

    const result = await search(params({ filters: { hasPhone: true } }));

    expect(result.fromCache).toBe(false);
    expect(result.provider).toBe("osm");
    expect(result.total).toBe(2);
    expect(result.results.map((p) => p.id)).toEqual(["a", "b"]);
    expect(provider.search).toHaveBeenCalledWith({
      query: "dentista",
      zone: "Merlo, Buenos Aires",
    });
    expect(cache.set).toHaveBeenCalledWith(
      "osm|dentista|merlo, buenos aires",
      places,
    );
  });

  it("la segunda búsqueda idéntica sale de caché", async () => {
    const provider = makeProvider("osm");
    const { cache } = makeCache();
    const search = createSearchPlaces({
      providers: { osm: provider, google: makeProvider("google") },
      cache,
      defaultProvider: "osm",
    });

    await search(params());
    const second = await search(params());

    expect(second.fromCache).toBe(true);
    expect(provider.search).toHaveBeenCalledTimes(1);
  });

  it("la clave ignora filtros y limit, y el límite se aplica después de filtrar", async () => {
    const provider = makeProvider("osm");
    const { cache } = makeCache();
    const search = createSearchPlaces({
      providers: { osm: provider, google: makeProvider("google") },
      cache,
      defaultProvider: "osm",
    });

    await search(params({ limit: 10 }));
    const second = await search(params({ limit: 1, filters: { hasPhone: true } }));

    expect(second.fromCache).toBe(true);
    expect(second.total).toBe(2);
    expect(second.results).toHaveLength(1);
    expect(provider.search).toHaveBeenCalledTimes(1);
  });

  it("avisa los filtros no soportados en vez de ignorarlos en silencio", async () => {
    const search = createSearchPlaces({
      providers: { osm: makeProvider("osm"), google: makeProvider("google") },
      cache: makeCache().cache,
      defaultProvider: "osm",
    });

    const result = await search(params({ filters: { minReviews: 5, minRating: 4 } }));

    expect(result.warnings).toEqual(
      expect.arrayContaining([
        "aviso de osm",
        expect.stringContaining("minReviews"),
        expect.stringContaining("minRating"),
      ]),
    );
    // Los filtros no soportados no se aplican.
    expect(result.total).toBe(3);
  });

  it("no avisa filtros no soportados si el provider las tiene", async () => {
    const google = makeProvider("google", { capabilities: { reviews: true, rating: true } });
    const search = createSearchPlaces({
      providers: { osm: makeProvider("osm"), google },
      cache: makeCache().cache,
      defaultProvider: "osm",
    });

    const result = await search(params({ provider: "google", filters: { minReviews: 1 } }));
    expect(result.provider).toBe("google");
    expect(result.warnings).not.toContainEqual(expect.stringContaining("minReviews"));
  });

  it("resuelve auto con el provider por defecto y lo informa", async () => {
    const search = createSearchPlaces({
      providers: { osm: makeProvider("osm"), google: makeProvider("google") },
      cache: makeCache().cache,
      defaultProvider: "osm",
    });

    const result = await search(params({ provider: "auto" }));
    expect(result.provider).toBe("osm");
    expect(result.warnings).toContain('provider=auto se resolvió como "osm".');
  });
});
