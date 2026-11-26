/** Formato común devuelto por cualquier proveedor. */
export type ProviderName = "google" | "osm";

export interface Place {
  /** Id del proveedor: place_id de Google, "osm:node/123" en OSM. */
  id: string;
  source: ProviderName;
  name: string;
  address?: string;
  lat?: number;
  lng?: number;
  /** Solo Google. OSM no inventa estos valores: quedan en undefined. */
  rating?: number;
  reviewCount?: number;
  phone?: string;
  website?: string;
  mapsUrl?: string;
  openNow?: boolean;
  businessStatus?: string;
}
