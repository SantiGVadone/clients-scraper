import type { GeocodedPlace, RouteMode } from "../types";

interface Props {
  address: string;
  origin: GeocodedPlace | null;
  mode: RouteMode;
  geocoding: boolean;
  planning: boolean;
  canPlan: boolean;
  onAddressChange: (value: string) => void;
  onGeocode: () => void;
  onModeChange: (value: RouteMode) => void;
  onPlan: () => void;
}

export function RoutePlanner({
  address,
  origin,
  mode,
  geocoding,
  planning,
  canPlan,
  onAddressChange,
  onGeocode,
  onModeChange,
  onPlan,
}: Props) {
  return (
    <section className="card">
      <h2>Recorrido</h2>
      <p className="hint">Por ahora el origen se indica escribiendo una dirección.</p>
      <div className="grid">
        <label>
          Dirección de origen
          <input
            value={address}
            placeholder="Ej. Av. Libertador 1234, Merlo"
            onChange={(event) => onAddressChange(event.target.value)}
          />
        </label>
        <label>
          Enlaces para
          <select
            value={mode}
            onChange={(event) => onModeChange(event.target.value as RouteMode)}
          >
            <option value="mobile">Celular (4 paradas por tramo)</option>
            <option value="desktop">Computadora (10 paradas por tramo)</option>
          </select>
        </label>
      </div>
      <div className="actions">
        <button type="button" onClick={onGeocode} disabled={geocoding || !address.trim()}>
          {geocoding ? "Ubicando…" : "Ubic origen"}
        </button>
        <button
          type="button"
          onClick={onPlan}
          disabled={!origin || !canPlan || planning}
        >
          {planning ? "Calculando…" : "Calcular recorrido"}
        </button>
      </div>
      {origin && (
        <p className="hint">
          Origen: {origin.label} ({origin.lat.toFixed(5)}, {origin.lng.toFixed(5)})
        </p>
      )}
    </section>
  );
}
