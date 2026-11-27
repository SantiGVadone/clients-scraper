import type { RouteResult, RouteStop } from "../types";

interface Props {
  result: RouteResult;
  selectedWithoutLocation: string[];
  onToggleWithoutLocation: (id: string) => void;
}

const formatKm = (km: number): string => `${km.toFixed(2).replace(".", ",")} km`;

function placeLabel(stop: RouteStop): string {
  return stop.place.address ? `${stop.place.name} — ${stop.place.address}` : stop.place.name;
}

export function RouteResults({ result, selectedWithoutLocation, onToggleWithoutLocation }: Props) {
  const chunkForStop = (stopNumber: number): number => {
    const index = result.chunks.findIndex(
      (chunk) => stopNumber >= chunk.fromStop && stopNumber <= chunk.toStop,
    );
    return index === -1 ? 0 : index % 4;
  };

  return (
    <section className="route-results" aria-labelledby="route-title">
      <header className="route-summary">
        <div>
          <p className="eyebrow">Recorrido listo</p>
          <h2 id="route-title">Tu ruta de visitas</h2>
        </div>
        <p className="distance">{formatKm(result.totalDistanceKm)}</p>
      </header>
      <p className="hint">
        Distancias en línea recta (aproximadas): no son distancias por calles ni tiempos de viaje.
      </p>

      {result.ordered.length > 0 ? (
        <div className="journey-wrap">
          <svg
            className="scroll-line"
            viewBox="0 0 2 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M1 0 L1 100" pathLength="100" vectorEffect="non-scaling-stroke" />
          </svg>
          <ol className="journey">
            <li className="station station--origin">
              <span className="station-dot" aria-hidden="true">
                O
              </span>
              <div className="station-info">
                <strong>Salida</strong>
                <span className="muted">
                  {result.origin.lat.toFixed(5)}, {result.origin.lng.toFixed(5)}
                </span>
              </div>
            </li>
            {result.ordered.map((stop) => (
              <li className={`station chunk-${chunkForStop(stop.stop)}`} key={stop.place.id}>
                <span className="station-dot" aria-hidden="true">
                  {stop.stop}
                </span>
                <div className="station-info">
                  <strong>{placeLabel(stop)}</strong>
                  <span className="muted">
                    {stop.stop === 1 ? "Desde la salida" : "Desde la parada anterior"}:{" "}
                    {formatKm(stop.distanceFromPreviousKm)}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <p className="hint">Ningún lugar con coordenadas para ordenar.</p>
      )}

      {result.warnings.length > 0 && (
        <div className="warnings">
          <strong>Tené en cuenta</strong>
          <ul>
            {result.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {result.withoutLocation.length > 0 && (
        <section className="apart-stops" aria-labelledby="apart-title">
          <h3 id="apart-title">Visitar aparte</h3>
          <p className="hint">Sin coordenadas: quedan fuera de la ruta y podés tildarlos para anotarlos.</p>
          <ul className="apart-list">
            {result.withoutLocation.map((place) => {
              const label = place.address ? `${place.name} — ${place.address}` : place.name;
              return (
                <li key={place.id}>
                  <label className="inline">
                    <input
                      type="checkbox"
                      checked={selectedWithoutLocation.includes(place.id)}
                      onChange={() => onToggleWithoutLocation(place.id)}
                    />
                    {label}
                  </label>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {result.chunks.length > 0 && (
        <section className="chunk-section" aria-labelledby="chunks-title">
          <h3 id="chunks-title">Abrir en Google Maps</h3>
          <p className="hint">
            Cada tramo sale de la última parada del anterior. En celular van hasta 4 paradas por
            enlace; en computadora, hasta 10.
          </p>
          <div className="chunk-links">
            {result.chunks.map((chunk, index) => (
              <a
                key={chunk.index}
                className={`chunk-link chunk-${index % 4}`}
                href={chunk.url}
                target="_blank"
                rel="noreferrer"
              >
                Tramo {chunk.index} · paradas {chunk.fromStop}–{chunk.toStop}
              </a>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
