import { useEffect, useState } from "react";
import {
  exportCsvUrl,
  fetchProviders,
  geocodeAddress,
  planRoute,
  searchPlaces,
} from "./api";
import { initialForm, toSearchParams, type FormState } from "./form";
import { FiltersPanel } from "./components/FiltersPanel";
import { ResultsSkeleton, ResultsTable } from "./components/ResultsTable";
import { RouteMap } from "./components/RouteMap";
import { RoutePlanner } from "./components/RoutePlanner";
import { RouteResults } from "./components/RouteResults";
import { SearchForm } from "./components/SearchForm";
import type {
  GeocodedPlace,
  ProviderCapabilities,
  ProviderDescriptor,
  ProviderName,
  RouteMode,
  RouteResult,
  SearchParams,
  SearchResponse,
} from "./types";

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "Error desconocido.";
}

export default function App() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [providers, setProviders] = useState<ProviderDescriptor[]>([]);
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [lastParams, setLastParams] = useState<SearchParams | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [originAddress, setOriginAddress] = useState("");
  const [origin, setOrigin] = useState<GeocodedPlace | null>(null);
  const [mode, setMode] = useState<RouteMode>("mobile");
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [selectedWithoutLocation, setSelectedWithoutLocation] = useState<string[]>([]);
  const [geocoding, setGeocoding] = useState(false);
  const [planning, setPlanning] = useState(false);

  useEffect(() => {
    fetchProviders()
      .then(setProviders)
      .catch((cause: unknown) => setError(messageOf(cause)));
  }, []);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]): void => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  // "auto" se resuelve en el backend; acá solo elegimos las capabilities visibles.
  const activeName: ProviderName =
    form.provider === "auto"
      ? (providers.find((provider) => provider.enabled)?.name ?? "osm")
      : form.provider;
  const capabilities: ProviderCapabilities = providers.find(
    (provider) => provider.name === activeName,
  )?.capabilities ?? { reviews: true, rating: true };

  const handleSubmit = async (): Promise<void> => {
    const params = toSearchParams(form, capabilities);
    setLoading(true);
    setError(null);
    try {
      const result = await searchPlaces(params);
      setResponse(result);
      setLastParams(params);
      setRouteResult(null);
      setSelectedWithoutLocation([]);
    } catch (cause: unknown) {
      setError(messageOf(cause));
      setResponse(null);
      setLastParams(null);
      setRouteResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleGeocode = async (): Promise<void> => {
    if (!originAddress.trim()) return;
    setGeocoding(true);
    setError(null);
    try {
      setOrigin(await geocodeAddress(originAddress.trim()));
    } catch (cause: unknown) {
      setError(messageOf(cause));
      setOrigin(null);
    } finally {
      setGeocoding(false);
    }
  };

  const handlePlan = async (): Promise<void> => {
    if (!origin || !response) return;
    setPlanning(true);
    setError(null);
    try {
      const result = await planRoute({ origin, places: response.results, mode });
      setRouteResult(result);
      setSelectedWithoutLocation([]);
    } catch (cause: unknown) {
      setError(messageOf(cause));
      setRouteResult(null);
    } finally {
      setPlanning(false);
    }
  };

  const toggleWithoutLocation = (id: string): void => {
    setSelectedWithoutLocation((previous) =>
      previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id],
    );
  };

  const currentStep = routeResult ? 3 : response ? 2 : 1;
  const steps = ["Buscar", "Elegir", "Recorrido"];

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <div className="brand">
            <h1>ClientsScraper</h1>
            <p className="lede">Encontrá negocios para ofrecerles lo que vendés.</p>
          </div>
          <nav className="steps" aria-label="Pasos del flujo">
            {steps.map((label, index) => {
              const number = index + 1;
              return (
                <span
                  key={label}
                  className="step"
                  aria-current={number === currentStep ? "step" : undefined}
                >
                  <b>{number}</b>
                  <span className="step-label">{label}</span>
                </span>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="workspace">
        <div className="search-shell">
          <SearchForm
            form={form}
            providers={providers}
            response={response}
            loading={loading}
            onChange={update}
            onSubmit={() => void handleSubmit()}
          />
        </div>
        <FiltersPanel
          form={form}
          capabilities={capabilities}
          resultCount={response?.results.length}
          onChange={update}
        />

        {error && (
          <div className="error" role="alert">
            <strong>No pudimos completar la acción.</strong>
            <p>{error}</p>
            <p className="hint">Revisá los datos y probá otra vez.</p>
          </div>
        )}

        {response && (
          <>
            <section
              className="results-section"
              aria-labelledby="results-title"
              aria-live="polite"
              aria-busy={loading}
            >
              <div className="results-header">
                <h2 id="results-title">Elegí a quién visitar</h2>
                {lastParams && (
                  <a
                    className={`button button--quiet ${response.results.length === 0 ? "disabled" : ""}`}
                    href={exportCsvUrl(lastParams)}
                    download="clientscraper.csv"
                    aria-disabled={response.results.length === 0}
                  >
                    Exportar CSV
                  </a>
                )}
              </div>

              {response.warnings.length > 0 && (
                <div className="warnings">
                  <strong>Tené en cuenta</strong>
                  <ul>
                    {response.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {loading ? <ResultsSkeleton /> : <ResultsTable results={response.results} />}
            </section>

            <section className="route-step" aria-labelledby="origin-title">
              <RoutePlanner
                address={originAddress}
                origin={origin}
                mode={mode}
                geocoding={geocoding}
                planning={planning}
                canPlan={response.results.length > 0}
                onAddressChange={setOriginAddress}
                onGeocode={() => void handleGeocode()}
                onModeChange={setMode}
                onPlan={() => void handlePlan()}
              />

              {routeResult && (
                <div className="route-layout">
                  <RouteResults
                    result={routeResult}
                    selectedWithoutLocation={selectedWithoutLocation}
                    onToggleWithoutLocation={toggleWithoutLocation}
                  />
                  <RouteMap result={routeResult} />
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </>
  );
}
