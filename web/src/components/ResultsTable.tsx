import type { Place } from "../types";

function websiteHref(website: string): string {
  return /^https?:\/\//i.test(website) ? website : `https://${website}`;
}

function ratingText(place: Place): string {
  if (place.rating === undefined) return "Sin rating";
  const rating = place.rating.toFixed(1).replace(".", ",");
  return place.reviewCount === undefined ? `★ ${rating}` : `★ ${rating} · ${place.reviewCount}`;
}

function Website({ place }: { place: Place }) {
  if (!place.website) return <span className="muted">Sin sitio web</span>;
  return (
    <a href={websiteHref(place.website)} target="_blank" rel="noreferrer">
      Ver sitio
    </a>
  );
}

export function ResultsTable({ results }: { results: Place[] }) {
  if (results.length === 0) {
    return (
      <div className="empty-state">
        <h3>No apareció ningún negocio con esos filtros.</h3>
        <p>Probá con otro rubro, otra zona o quitá alguno de los filtros.</p>
      </div>
    );
  }

  return (
    <>
      <div className="table-wrap results-table">
        <table>
          <thead>
            <tr>
              <th>Negocio</th>
              <th>Contacto</th>
              <th>Sitio web</th>
              <th>Rating</th>
              <th>Mapa</th>
            </tr>
          </thead>
          <tbody>
            {results.map((place) => (
              <tr key={place.id}>
                <td>
                  <strong>{place.name}</strong>
                  {place.address && <span className="muted row-address">{place.address}</span>}
                </td>
                <td>
                  {place.phone ? (
                    <a href={`tel:${place.phone}`}>{place.phone}</a>
                  ) : (
                    <span className="muted">Sin teléfono</span>
                  )}
                </td>
                <td>
                  <Website place={place} />
                </td>
                <td>{ratingText(place)}</td>
                <td>
                  {place.mapsUrl ? (
                    <a href={place.mapsUrl} target="_blank" rel="noreferrer">
                      Ver
                    </a>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="place-cards">
        {results.map((place) => (
          <li className="place-card" key={place.id}>
            <strong>{place.name}</strong>
            {place.address && <span className="muted">{place.address}</span>}
            <div className="place-card-actions">
              {place.phone ? (
                <a href={`tel:${place.phone}`}>Llamar</a>
              ) : (
                <span className="muted">Sin teléfono</span>
              )}
              <Website place={place} />
              {place.mapsUrl && (
                <a href={place.mapsUrl} target="_blank" rel="noreferrer">
                  Mapa
                </a>
              )}
            </div>
            <span className="muted">{ratingText(place)}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

export function ResultsSkeleton() {
  return (
    <div className="skeleton-block" aria-hidden="true">
      {[0, 1, 2].map((row) => (
        <div className="skeleton-row" key={row}>
          <span className="skeleton skeleton-title" />
          <span className="skeleton skeleton-line" />
          <span className="skeleton skeleton-short" />
        </div>
      ))}
    </div>
  );
}
