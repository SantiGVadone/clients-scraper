import type { FormState } from "../form";
import type { ProviderCapabilities } from "../types";

interface Props {
  form: FormState;
  capabilities: ProviderCapabilities;
  resultCount?: number;
  onChange: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
}

export function FiltersPanel({ form, capabilities, resultCount, onChange }: Props) {
  const withoutWebsite = form.hasWebsite === "false";
  const withPhone = form.hasPhone === "true";

  return (
    <section className="filters" aria-label="Filtros rápidos">
      <div className="filters-head">
        <p className="filters-title">Filtros</p>
        <p className="result-count" aria-live="polite">
          {resultCount === undefined ? "Buscá para ver negocios" : `${resultCount} negocios`}
        </p>
      </div>

      <div className="chip-row">
        <button
          type="button"
          className={`chip${withoutWebsite ? " is-on" : ""}`}
          aria-pressed={withoutWebsite}
          onClick={() => onChange("hasWebsite", withoutWebsite ? "" : "false")}
        >
          Sin sitio web
        </button>
        <button
          type="button"
          className={`chip${withPhone ? " is-on" : ""}`}
          aria-pressed={withPhone}
          onClick={() => onChange("hasPhone", withPhone ? "" : "true")}
        >
          Con teléfono
        </button>

        <label className={`chip-input${capabilities.reviews ? "" : " is-disabled"}`}>
          Reseñas mínimas
          <input
            type="number"
            min={0}
            value={form.minReviews}
            disabled={!capabilities.reviews}
            placeholder="ej. 20"
            onChange={(event) => onChange("minReviews", event.target.value)}
          />
        </label>
        <label className={`chip-input${capabilities.rating ? "" : " is-disabled"}`}>
          Rating mínimo
          <input
            type="number"
            min={0}
            max={5}
            step={0.1}
            value={form.minRating}
            disabled={!capabilities.rating}
            placeholder="ej. 4"
            onChange={(event) => onChange("minRating", event.target.value)}
          />
        </label>
      </div>

      {(!capabilities.reviews || !capabilities.rating) && (
        <p className="filter-note" id="filter-note">
          Esta fuente no informa reseñas ni rating: esos filtros no se aplican.
        </p>
      )}
    </section>
  );
}
