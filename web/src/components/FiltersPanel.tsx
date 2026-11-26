import type { FormState } from "../form";
import type { ProviderCapabilities } from "../types";

interface Props {
  form: FormState;
  capabilities: ProviderCapabilities;
  onChange: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
}

export function FiltersPanel({ form, capabilities, onChange }: Props) {
  return (
    <section className="card">
      <h2>Filtros</h2>
      <div className="grid">
        <label>
          Reseñas mínimas
          <input
            type="number"
            min={0}
            value={form.minReviews}
            disabled={!capabilities.reviews}
            placeholder={capabilities.reviews ? "ej. 20" : "no disponible"}
            onChange={(event) => onChange("minReviews", event.target.value)}
          />
        </label>
        <label>
          Rating mínimo
          <input
            type="number"
            min={0}
            max={5}
            step={0.1}
            value={form.minRating}
            disabled={!capabilities.rating}
            placeholder={capabilities.rating ? "ej. 4" : "no disponible"}
            onChange={(event) => onChange("minRating", event.target.value)}
          />
        </label>
        <label>
          Sitio web
          <select
            value={form.hasWebsite}
            onChange={(event) =>
              onChange("hasWebsite", event.target.value as FormState["hasWebsite"])
            }
          >
            <option value="">Indistinto</option>
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
        </label>
        <label>
          Teléfono
          <select
            value={form.hasPhone}
            onChange={(event) => onChange("hasPhone", event.target.value as FormState["hasPhone"])}
          >
            <option value="">Indistinto</option>
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
        </label>
      </div>
      {(!capabilities.reviews || !capabilities.rating) && (
        <p className="hint">
          Este proveedor no informa reseñas ni rating: esos filtros están deshabilitados.
        </p>
      )}
    </section>
  );
}
