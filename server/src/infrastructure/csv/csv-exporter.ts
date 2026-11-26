import type { Place } from "../../domain/place";

const COLUMNS: Array<[keyof Place, string]> = [
  ["id", "id"],
  ["source", "source"],
  ["name", "name"],
  ["address", "address"],
  ["lat", "lat"],
  ["lng", "lng"],
  ["rating", "rating"],
  ["reviewCount", "reviewCount"],
  ["phone", "phone"],
  ["website", "website"],
  ["mapsUrl", "mapsUrl"],
  ["businessStatus", "businessStatus"],
];

function escapeCell(value: unknown): string {
  if (value === undefined || value === null) return "";
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** CSV con BOM y CRLF para abrirlo sin problemas en Excel. */
export function serializeCsv(places: readonly Place[]): string {
  const lines = [COLUMNS.map(([, header]) => header).join(",")];
  for (const place of places) {
    lines.push(COLUMNS.map(([field]) => escapeCell(place[field])).join(","));
  }
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}
