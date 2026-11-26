import type { Place } from "../types";

function websiteHref(website: string): string {
  return /^https?:\/\//i.test(website) ? website : `https://${website}`;
}

export function ResultsTable({ results }: { results: Place[] }) {
  if (results.length === 0) {
    return <p className="hint">No se encontraron resultados con los filtros elegidos.</p>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Dirección</th>
            <th>Teléfono</th>
            <th>Sitio web</th>
            <th>Rating</th>
            <th>Reseñas</th>
            <th>Mapa</th>
          </tr>
        </thead>
        <tbody>
          {results.map((place) => (
            <tr key={place.id}>
              <td>{place.name}</td>
              <td>{place.address ?? "—"}</td>
              <td>{place.phone ? <a href={`tel:${place.phone}`}>{place.phone}</a> : "—"}</td>
              <td>
                {place.website ? (
                  <a href={websiteHref(place.website)} target="_blank" rel="noreferrer">
                    {place.website}
                  </a>
                ) : (
                  "—"
                )}
              </td>
              <td>{place.rating ?? "—"}</td>
              <td>{place.reviewCount ?? "—"}</td>
              <td>
                {place.mapsUrl ? (
                  <a href={place.mapsUrl} target="_blank" rel="noreferrer">
                    Ver
                  </a>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
