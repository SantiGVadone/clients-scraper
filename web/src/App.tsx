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
import { ResultsTable } from "./components/ResultsTable";
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

  return (
    <>
      <header>
        <h1>ClientsScraper</h1>
        <p>Encontrá negocios locales para ofrecerles tus productos.</p>
      </header>

      <main>
        <SearchForm
          form={form}
          providers={providers}
          loading={loading}
          onChange={update}
          onSubmit={() => void handleSubmit()}
        />
        <FiltersPanel form={form} capabilities={capabilities} onChange={update} />

        {error && <div className="error">{error}</div>}

        {response && (
          <>
            <section className="card">
              <div className="results-header">
                <h2>Resultados</h2>
                <div>
                  <span className="badge">provider: {response.provider}</span>
                  <span className="badge">
                    {response.fromCache ? "desde caché" : "consulta nueva"}
                  </span>
                  <span className="badge">
                    {response.results.length} de {response.total}
                  </span>
                  {lastParams && (
                    <a
                      className={`button ${response.results.length === 0 ? "disabled" : ""}`}
                      href={exportCsvUrl(lastParams)}
                      download="clientscraper.csv"
                      aria-disabled={response.results.length === 0}
                    >
                      Exportar CSV
                    </a>
                  )}
                </div>
              </div>

              {response.warnings.length > 0 && (
                <div className="warnings">
                  <strong>Advertencias</strong>
                  <ul>
                    {response.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              <ResultsTable results={response.results} />
            </section>

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
              <>
                <RouteResults
                  result={routeResult}
                  selectedWithoutLocation={selectedWithoutLocation}
                  onToggleWithoutLocation={toggleWithoutLocation}
                />
                <RouteMap result={routeResult} />
              </>
            )}
          </>
        )}
      </main>
    </>
  );
}
