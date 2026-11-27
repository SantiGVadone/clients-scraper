import { describe, expect, it, vi } from "vitest";
import { ProviderUnavailableError, QuotaExceededError } from "../../src/domain/errors";
import {
  createGoogleClient,
  GOOGLE_FIELD_MASK,
} from "../../src/infrastructure/providers/google/google-client";
import type { FetchFn } from "../../src/infrastructure/fetch";

function makeClient(fetchFn: FetchFn) {
  return createGoogleClient({
    apiKey: "clave-de-prueba",
    languageCode: "es",
    regionCode: "AR",
    fetchFn,
  });
}

describe("GoogleClient", () => {
  it("envía headers, body y pagina con pageToken", async () => {
    const fetchFn = vi.fn(async (_url: string, _init?: RequestInit) =>
      Response.json({ places: [{ id: "p1" }], nextPageToken: "t2" }),
    );
    const client = makeClient(fetchFn);

    expect(await client.searchText("dentista Merlo")).toEqual({
      places: [{ id: "p1" }],
      nextPageToken: "t2",
    });
    await client.searchText("dentista Merlo", "t2");

    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe("https://places.googleapis.com/v1/places:searchText");
    const headers = init?.headers as Record<string, string>;
    expect(headers["X-Goog-Api-Key"]).toBe("clave-de-prueba");
    expect(headers["X-Goog-FieldMask"]).toBe(GOOGLE_FIELD_MASK);
    expect(GOOGLE_FIELD_MASK).toContain("places.rating");
    expect(JSON.parse(init?.body as string)).toMatchObject({
      textQuery: "dentista Merlo",
      languageCode: "es",
      regionCode: "AR",
      pageSize: 20,
    });

    const secondInit = fetchFn.mock.calls[1][1];
    expect(JSON.parse(secondInit?.body as string)).toMatchObject({ pageToken: "t2" });
  });

  it("traduce 429 a QuotaExceededError", async () => {
    const client = makeClient(async () => new Response(null, { status: 429 }));
    await expect(client.searchText("dentista Merlo")).rejects.toBeInstanceOf(QuotaExceededError);
  });

  it("traduce 403 a ProviderUnavailableError con el mensaje de Google", async () => {
    const client = makeClient(async () =>
      Response.json(
        { error: { message: "API no habilitada" } },
        { status: 403 },
      ),
    );
    const error = await client.searchText("dentista Merlo").catch((cause: unknown) => cause);
    expect(error).toBeInstanceOf(ProviderUnavailableError);
    expect(String((error as ProviderUnavailableError).cause)).toContain("API no habilitada");
  });

  it("devuelve lista vacía si Google omite places", async () => {
    const client = makeClient(async () => Response.json({}));
    expect(await client.searchText("dentista Merlo")).toEqual({ places: [], nextPageToken: undefined });
  });
});
