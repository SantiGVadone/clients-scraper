import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { RouteResult } from "../types";

const fallbackColors = ["#2e5aac", "#d3543a", "#2f8f6b", "#7a4fb3"];

/** Leaflet imperativo: sin wrapper de React ni librerías extra. */
export function RouteMap({ result }: { result: RouteResult }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = L.map(containerRef.current, { scrollWheelZoom: false });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    const points: L.LatLng[] = [L.latLng(result.origin.lat, result.origin.lng)];
    const palette = [1, 2, 3, 4].map((number) => {
      const token = getComputedStyle(document.documentElement)
        .getPropertyValue(`--line-${number}`)
        .trim();
      return token || fallbackColors[number - 1];
    });
    const chunkForStop = (stopNumber: number): number => {
      const index = result.chunks.findIndex(
        (chunk) => stopNumber >= chunk.fromStop && stopNumber <= chunk.toStop,
      );
      return index === -1 ? 0 : index % 4;
    };

    L.marker(points[0], {
      icon: L.divIcon({
        className: "origin-marker",
        html: "O",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }),
    })
      .bindPopup("Salida")
      .addTo(layer);

    for (const stop of result.ordered) {
      const position = L.latLng(stop.coordinate.lat, stop.coordinate.lng);
      const chunk = chunkForStop(stop.stop);
      L.marker(position, {
        icon: L.divIcon({
          className: `stop-marker chunk-${chunk}`,
          html: String(stop.stop),
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        }),
      })
        .bindPopup(`${stop.stop}. ${stop.place.name}`)
        .addTo(layer);
      points.push(position);
    }

    if (result.chunks.length > 0 && points.length > 1) {
      for (const [index, chunk] of result.chunks.entries()) {
        const segment = points.slice(chunk.fromStop - 1, chunk.toStop + 1);
        if (segment.length < 2) continue;
        L.polyline(segment, { color: palette[index % palette.length], weight: 4 }).addTo(layer);
      }
    } else if (points.length > 1) {
      L.polyline(points, { color: palette[0], weight: 4 }).addTo(layer);
    }

    if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points), { padding: [30, 30], maxZoom: 15 });
    } else {
      map.setView(points[0], 15);
    }
    map.invalidateSize();
  }, [result]);

  return (
    <section className="map-panel" aria-labelledby="map-title">
      <h3 id="map-title">Mapa del recorrido</h3>
      <div
        ref={containerRef}
        className="route-map"
        role="img"
        aria-label="Mapa del recorrido con salida y paradas numeradas por tramo"
      />
    </section>
  );
}
