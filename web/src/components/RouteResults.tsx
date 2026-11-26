import type { Place, RouteResult } from "../types";

interface Props {
  result: RouteResult;
  selectedWithoutLocation: string[];
  onToggleWithoutLocation: (id: string) => void;
}

const formatKm = (km: number): string => `${km.toFixed(2).replace(".", ",")} km`;

function placeLabel(place: Place): string {
  return place.address ? `${place.name} — ${place.address}` : place.name;
}

export function RouteResults({ result, selectedWithoutLocation, onToggleWithoutLocation }: Props) {
  const selected = result.withoutLocation.filter((place) =>
    selectedWithoutLocation.includes(place.id),
  );

  return (
    <section className="card">
      <div className="results-header">
        <h2>Recorrido ordenado</h2>
        <span className="badge">Total: {formatKm(result.totalDistanceKm)}</span>
      </div>
      <p className="hint">
        Distancias en línea recta (aproximadas): no son distancias por calles ni tiempos de viaje.
      </p>

      {result.ordered.length > 0 ? (
        <ol className="stops">
          {result.ordered.map((stop) => (
            <li key={stop.place.id}>
              <strong>Parada {stop.stop}</strong> — {placeLabel(stop.place)}
              <span className="hint">
                {stop.stop === 1 ? "Desde el origen" : "Desde la parada anterior"}:{" "}
                {formatKm(stop.distanceFromPreviousKm)}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="hint">Ningún lugar con coordenadas para ordenar.</p>
      )}

      {result.warnings.length > 0 && (
        <div className="warnings">
          <strong>Advertencias</strong>
          <ul>
            {result.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {result.withoutLocation.length > 0 && (
        <div className="subsection">
          <h3>Sin ubicación</h3>
          <p className="hint">Se visitan aparte: no tienen número de parada ni distancia.</p>
          <ul className="plain-list">
            {result.withoutLocation.map((place) => (
              <li key={place.id}>
                <label className="inline">
                  <input
                    type="checkbox"
                    checked={selectedWithoutLocation.includes(place.id)}
                    onChange={() => onToggleWithoutLocation(place.id)}
                  />
                  {placeLabel(place)}
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="subsection">
        <h3>Lista final</h3>
        <ol className="stops">
          {result.ordered.map((stop) => (
            <li key={stop.place.id}>
              Parada {stop.stop} — {placeLabel(stop.place)}
            </li>
          ))}
          {selected.map((place) => (
            <li key={place.id}>Visitar aparte — {placeLabel(place)}</li>
          ))}
        </ol>
      </div>

      {result.chunks.length > 0 && (
        <div className="subsection">
          <h3>Abrir en Google Maps</h3>
          <p className="hint">
            Cada tramo sale de la última parada del anterior. En celular, Google admite hasta 3
            waypoints por enlace.
          </p>
          <div className="actions">
            {result.chunks.map((chunk) => (
              <a
                key={chunk.index}
                className="button"
                href={chunk.url}
                target="_blank"
                rel="noreferrer"
              >
                {chunk.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
