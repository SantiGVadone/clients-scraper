import { createHash } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Place } from "../../domain/place";
import type { SearchCache } from "../../application/ports/search-cache";

interface CacheEntry {
  savedAt: number;
  places: Place[];
}

/** Caché JSON en disco. Un archivo por clave, con TTL. */
export function createFileCache(options: {
  directory: string;
  ttlHours: number;
  now?: () => number;
}): SearchCache {
  const ttlMs = options.ttlHours * 60 * 60 * 1000;
  const now = options.now ?? Date.now;

  const fileFor = (key: string): string =>
    join(options.directory, `${createHash("sha1").update(key).digest("hex")}.json`);

  return {
    async get(key) {
      const file = fileFor(key);
      try {
        const entry = JSON.parse(await readFile(file, "utf8")) as CacheEntry;
        if (now() - entry.savedAt > ttlMs) {
          await unlink(file).catch(() => undefined);
          return undefined;
        }
        return Array.isArray(entry.places) ? entry.places : undefined;
      } catch {
        // Un archivo ausente o corrupto no debe romper la búsqueda.
        return undefined;
      }
    },

    async set(key, places) {
      await mkdir(options.directory, { recursive: true });
      const entry: CacheEntry = { savedAt: now(), places: [...places] };
      await writeFile(fileFor(key), JSON.stringify(entry), "utf8");
    },
  };
}
