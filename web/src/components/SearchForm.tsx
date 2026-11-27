import type { FormState } from "../form";
import type { ProviderDescriptor, SearchResponse } from "../types";

interface Props {
  form: FormState;
  providers: ProviderDescriptor[];
  response: SearchResponse | null;
  loading: boolean;
  onChange: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  onSubmit: () => void;
}

const providerLabel: Record<string, string> = {
  osm: "OpenStreetMap",
  google: "Google",
};

export function SearchForm({ form, providers, response, loading, onChange, onSubmit }: Props) {
  return (
    <form
      className="search-bar"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <label>
        Rubro
        <input
          value={form.query}
          placeholder="dentista"
          onChange={(event) => onChange("query", event.target.value)}
          required
        />
      </label>
      <label>
        Zona
        <input
          value={form.zone}
          placeholder="Merlo, Buenos Aires"
          onChange={(event) => onChange("zone", event.target.value)}
          required
        />
      </label>
      <button type="submit" disabled={loading}>
        {loading ? "Buscando…" : "Buscar negocios"}
      </button>

      <details className="advanced advanced--search">
        <summary>Avanzado</summary>
        <div className="advanced-grid">
          <label>
            Mostrar hasta
            <input
              type="number"
              min={1}
              max={500}
              value={form.limit}
              onChange={(event) => onChange("limit", Number(event.target.value))}
            />
          </label>
          <label>
            Fuente de datos
            <select
              value={form.provider}
              onChange={(event) =>
                onChange("provider", event.target.value as FormState["provider"])
              }
            >
              <option value="auto">Recomendada</option>
              {providers.map((provider) => (
                <option key={provider.name} value={provider.name} disabled={!provider.enabled}>
                  {providerLabel[provider.name] ?? provider.name}
                  {provider.enabled ? "" : " (próximamente)"}
                </option>
              ))}
            </select>
          </label>
        </div>
        {response && (
          <p className="hint technical">
            Datos de {providerLabel[response.provider] ?? response.provider}
            {response.fromCache ? " · guardados de una búsqueda previa" : " · consulta nueva"}.
          </p>
        )}
      </details>
    </form>
  );
}
