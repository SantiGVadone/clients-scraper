import type { FormState } from "../form";
import type { ProviderDescriptor } from "../types";

interface Props {
  form: FormState;
  providers: ProviderDescriptor[];
  loading: boolean;
  onChange: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  onSubmit: () => void;
}

export function SearchForm({ form, providers, loading, onChange, onSubmit }: Props) {
  return (
    <form
      className="card"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <h2>Búsqueda</h2>
      <div className="grid">
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
        <label>
          Límite
          <input
            type="number"
            min={1}
            max={500}
            value={form.limit}
            onChange={(event) => onChange("limit", Number(event.target.value))}
          />
        </label>
        <label>
          Proveedor
          <select
            value={form.provider}
            onChange={(event) =>
              onChange("provider", event.target.value as FormState["provider"])
            }
          >
            <option value="auto">auto (por defecto)</option>
            {providers.map((provider) => (
              <option key={provider.name} value={provider.name} disabled={!provider.enabled}>
                {provider.name}
                {provider.enabled ? "" : " (próximamente)"}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button type="submit" disabled={loading}>
        {loading ? "Buscando…" : "Buscar prospectos"}
      </button>
    </form>
  );
}
