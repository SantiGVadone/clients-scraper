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
    <section className="route-setup" aria-labelledby="origin-title">
      <p className="eyebrow">Paso 3</p>
      <h2 id="origin-title">¿Desde dónde salís?</h2>
      <p className="hint">Escribí tu dirección de salida para ordenar las paradas.</p>

      <form
        className="route-origin"
        onSubmit={(event) => {
          event.preventDefault();
          onGeocode();
        }}
      >
        <label>
          Dirección
          <input
            value={address}
            placeholder="Ej. Av. Libertador 1234, Merlo"
            onChange={(event) => onAddressChange(event.target.value)}
          />
        </label>
        <button type="submit" disabled={geocoding || !address.trim()}>
          {geocoding ? "Ubicando…" : "Usar dirección"}
        </button>
      </form>

      {geocoding && (
        <p className="hint" role="status">
          Buscando la dirección…
        </p>
      )}

      {origin && (
        <p className="origin-confirmed" role="status">
          Origen confirmado: {origin.label}. Ya podés armar el recorrido.
        </p>
      )}

      <div className="route-actions">
        <label className="route-mode">
          Preparar enlaces para
          <select
            value={mode}
            onChange={(event) => onModeChange(event.target.value as RouteMode)}
          >
            <option value="mobile">Celular (4 paradas por tramo)</option>
            <option value="desktop">Computadora (10 paradas por tramo)</option>
          </select>
        </label>
        <button type="button" onClick={onPlan} disabled={!origin || !canPlan || planning}>
          {planning ? "Calculando…" : "Armar recorrido"}
        </button>
      </div>
    </section>
  );
}
