import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createFileCache } from "../../src/infrastructure/cache/file-cache";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function makeCache(ttlHours = 1) {
  const directory = await mkdtemp(join(tmpdir(), "clientsscraper-cache-"));
  tempDirs.push(directory);
  let clock = 1_000_000;
  const cache = createFileCache({ directory, ttlHours, now: () => clock });
  return { cache, advance: (ms: number) => void (clock += ms) };
}

describe("createFileCache", () => {
  it("guarda y lee resultados por clave", async () => {
    const { cache } = await makeCache();
    const places = [{ id: "osm:node/1", source: "osm" as const, name: "Consultorio" }];

    await cache.set("osm|dentista|Merlo", places);
    expect(await cache.get("osm|dentista|Merlo")).toEqual(places);
    expect(await cache.get("osm|farmacia|Merlo")).toBeUndefined();
  });

  it("respeta el TTL y descarta entradas vencidas", async () => {
    const { cache, advance } = await makeCache(1);
    await cache.set("key", []);

    advance(60 * 60 * 1000 + 1);
    expect(await cache.get("key")).toBeUndefined();
  });

  it("trata archivos corruptos como cache miss", async () => {
    const { cache } = await makeCache();
    await cache.set("key", []);
    expect(await cache.get("key")).toEqual([]);
  });
});
