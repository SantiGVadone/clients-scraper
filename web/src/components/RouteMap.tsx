import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { RouteResult } from "../types";

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
    const points: L.LatLng[] = [];

    const origin = L.latLng(result.origin.lat, result.origin.lng);
    L.marker(origin, {
      icon: L.divIcon({
        className: "origin-marker",
        html: "O",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }),
    })
      .bindPopup("Origen")
      .addTo(layer);
    points.push(origin);

    for (const stop of result.ordered) {
      const position = L.latLng(stop.coordinate.lat, stop.coordinate.lng);
      L.marker(position, {
        icon: L.divIcon({
          className: "stop-marker",
          html: String(stop.stop),
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        }),
      })
        .bindPopup(`${stop.stop}. ${stop.place.name}`)
        .addTo(layer);
      points.push(position);
    }

    if (points.length > 1) {
      L.polyline(points, { color: "#2563eb", weight: 3 }).addTo(layer);
      map.fitBounds(L.latLngBounds(points), { padding: [30, 30], maxZoom: 15 });
    } else {
      map.setView(points[0], 15);
    }
  }, [result]);

  return (
    <section className="card">
      <h2>Mapa</h2>
      <div
        ref={containerRef}
        className="route-map"
        role="img"
        aria-label="Mapa del recorrido con origen y paradas numeradas"
      />
    </section>
  );
}
