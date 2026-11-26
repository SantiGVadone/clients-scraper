import { describe, expect, it } from "vitest";
import {
  buildRouteLinks,
  CHUNK_SIZE,
  type RouteChunk,
} from "../../src/application/services/route-links";
import type { RouteStop } from "../../src/domain/route";

const origin = { lat: 0, lng: 0 };

function stops(count: number): RouteStop[] {
  return Array.from({ length: count }, (_, index) => ({
    place: { id: `p${index + 1}`, source: "osm" as const, name: `P${index + 1}` },
    coordinate: { lat: 0, lng: index + 1 },
    stop: index + 1,
    distanceFromPreviousKm: 1,
  }));
}

function params(chunk: RouteChunk): URLSearchParams {
  return new URL(chunk.url).searchParams;
}

describe("buildRouteLinks", () => {
  it("usa 4 paradas por tramo en mobile y encadena el origen", () => {
    expect(CHUNK_SIZE.mobile).toBe(4);
    const { chunks, warnings } = buildRouteLinks(origin, stops(8), "mobile");

    expect(chunks.map((chunk) => chunk.label)).toEqual([
      "Tramo 1: paradas 1 a 4",
      "Tramo 2: paradas 5 a 8",
    ]);
    expect(params(chunks[0]).get("origin")).toBe("0,0");
    expect(params(chunks[0]).get("destination")).toBe("0,4");
    expect(params(chunks[0]).get("waypoints")?.split("|")).toHaveLength(3);
    expect(params(chunks[1]).get("origin")).toBe("0,4");
    expect(params(chunks[1]).get("destination")).toBe("0,8");
    expect(warnings).toEqual([]);
  });

  it("usa 10 paradas por tramo en desktop y omite waypoints si sobra una sola parada", () => {
    expect(CHUNK_SIZE.desktop).toBe(10);
    const { chunks } = buildRouteLinks(origin, stops(11), "desktop");

    expect(chunks).toHaveLength(2);
    expect(chunks[0].label).toBe("Tramo 1: paradas 1 a 10");
    expect(params(chunks[0]).get("waypoints")?.split("|")).toHaveLength(9);
    expect(chunks[1].label).toBe("Tramo 2: paradas 11 a 11");
    expect(params(chunks[1]).get("waypoints")).toBeNull();
    expect(params(chunks[1]).get("origin")).toBe("0,10");
    expect(new URL(chunks[0].url).href.length).toBeLessThan(2048);
  });

  it("avisa si una URL supera el máximo de caracteres", () => {
    const result = buildRouteLinks(origin, stops(4), "mobile", 50);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("Tramo 1");
  });

  it("no genera tramos si no hay paradas", () => {
    expect(buildRouteLinks(origin, [], "mobile")).toEqual({ chunks: [], warnings: [] });
  });
});
