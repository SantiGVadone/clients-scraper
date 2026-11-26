import { describe, expect, it } from "vitest";
import { serializeCsv } from "../../src/infrastructure/csv/csv-exporter";

describe("serializeCsv", () => {
  it("escapa comillas, comas y saltos de línea", () => {
    const csv = serializeCsv([
      {
        id: "osm:way/1",
        source: "osm",
        name: 'Clínica "Dental", Merlo',
        address: "Av. Libertador 1234",
        phone: "+54 11 1234",
      },
    ]);

    expect(csv.startsWith("\uFEFFid,source,name")).toBe(true);
    expect(csv).toContain('"Clínica ""Dental"", Merlo"');
    expect(csv.split("\r\n")).toHaveLength(3);
    expect(csv).toContain("osm:way/1,osm,");
  });
});
