# ClientsScraper

Buscador de negocios locales pensado para **emprendedores que quieren salir a vender** (por ejemplo, un programador que ofrece páginas web) pero no saben a qué negocios de la zona acercarse.

Se busca un rubro en una zona (ej: *"dentista" en "Merlo, Buenos Aires"*), se filtran los resultados por **reseñas, rating, teléfono y sitio web**, y se obtiene una lista de prospectos lista para trabajar.

> Proyecto de aprendizaje / prueba de concepto. Objetivo secundario: **mantener todo dentro de planes gratuitos**.

---

## Caso de uso

> "Soy programador y vendo webs. Quiero encontrar dentistas, gimnasios o canchas de fútbol en mi zona que **no tengan sitio web**, que **sí tengan teléfono** para contactarlos y que tengan **buenas reseñas** (o sea, un negocio que funciona y puede pagar un servicio)."

---

## Funcionalidades (MVP)

- Búsqueda por **rubro** + **zona** (texto libre).
- Límite de resultados (por defecto 50).
- Filtros:
  - Cantidad mínima de reseñas.
  - Rating mínimo.
  - Tiene / no tiene sitio web.
  - Tiene / no tiene teléfono.
- Interfaz web simple (React) con tabla de resultados.
- Exportar a CSV.
- Caché local de resultados para no gastar cuota de las APIs mientras se prueba.

### Fuera del MVP (ideas a futuro)

- Búsqueda por sub-zonas (barrios) para superar el límite de resultados por consulta.
- Guardar prospectos con estado (contactado / interesado / descartado).
- Ordenar por un "score" de prospecto.
- Exportar a Google Sheets.
- CLI además de la web.

---

## Estrategia de datos: dos proveedores

La app usa una **capa de proveedores intercambiable**. Cada proveedor devuelve el mismo formato de datos, así los filtros, la API y el frontend no cambian según de dónde vengan los datos.

| | **Google Places API (New)** | **OpenStreetMap (Overpass + Nominatim)** |
|---|---|---|
| Rol | Proveedor principal | Plan B / complemento |
| Costo | Gratis dentro del cupo mensual (requiere tarjeta) | Gratis, sin tarjeta ni API key |
| Reseñas y rating | Sí | **No existen** |
| Teléfono / web | Muy completos | Irregulares, dependen de voluntarios |
| Actualización | Alta | Variable, hay negocios cerrados o sin cargar |
| Límite por búsqueda | 60 resultados (3 páginas de 20) | Sin tope fijo (limitado por timeout y fair use) |
| Búsqueda | Texto libre ("dentista en Merlo") | Por **tags** (`amenity=dentist`), hay que traducir cada rubro |

### Por qué no scraping directo de Google Maps

Automatizar el navegador contra Google Maps (Playwright/Selenium) viola los términos de uso de Google, es frágil (cualquier cambio de HTML lo rompe) y expone a bloqueos y captchas. Se descarta a propósito.

---

## Google Places API (New): uso gratuito

**Estado en la app:** implementado. Se habilita automáticamente cuando `GOOGLE_PLACES_API_KEY` está configurada; `auto` sigue resolviendo a OSM y Google se elige explícitamente en el selector. La búsqueda usa `textQuery` con rubro + zona (no `locationBias`, porque Google lo ignora cuando el texto ya incluye la zona). El gasto se limita con `GOOGLE_MAX_PAGES` (default 3) y `GOOGLE_MAX_REQUESTS_PER_DAY` (default 30).

Desde marzo de 2025 Google reemplazó el crédito de USD 200 mensuales por un **cupo gratuito mensual por SKU**:

| Categoría | Requests gratis / mes |
|---|---|
| Essentials | 10.000 |
| Pro | 5.000 |
| Enterprise | 1.000 |

Los campos que interesan acá (rating, cantidad de reseñas, sitio web, teléfono) caen en la categoría **Enterprise** → **1.000 requests gratis por mes**. Cada página de 20 resultados es 1 request, o sea que una búsqueda de 50 resultados consume 3. Alcanzan para unas ~300 búsquedas mensuales.

Pasado el cupo, Text Search Enterprise cuesta del orden de USD 35 cada 1.000 requests.

> ⚠️ Los precios y cupos cambian. Verificar siempre en la [tabla oficial de precios](https://developers.google.com/maps/billing-and-pricing/pricing) y en [las categorías de precios](https://developers.google.com/maps/billing-and-pricing/pricing-categories) antes de depender de estos números.

### Protecciones para no pagar nada

Para activar la API hay que vincular una tarjeta y habilitar facturación. Para evitar sorpresas:

1. **Cuotas diarias bajas** en Google Cloud → *APIs y servicios* → *Places API (New)* → *Cuotas*. Ejemplo: 30 requests/día. Al llegar al tope la API devuelve error en vez de cobrar.
2. **Alerta de presupuesto** de USD 1 en *Facturación → Presupuestos y alertas*.
3. **Restringir la API key** (solo Places API (New), y por IP si es posible). Nunca subirla al repo.
4. **Caché local** de respuestas (ver más abajo).
5. Pedir **solo los campos necesarios** con `FieldMask`: cada campo extra puede subir de categoría y de precio.

### Llamada base

```ts
const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": process.env.GOOGLE_PLACES_API_KEY!,
    "X-Goog-FieldMask": [
      "places.id",
      "places.displayName",
      "places.formattedAddress",
      "places.location",
      "places.googleMapsUri",
      "places.businessStatus",
      "places.rating",
      "places.userRatingCount",
      "places.websiteUri",
      "places.nationalPhoneNumber",
      "nextPageToken",
    ].join(","),
  },
  body: JSON.stringify({
    textQuery: "dentista en Merlo, Buenos Aires",
    languageCode: "es",
    regionCode: "AR",
    pageSize: 20,
    // pageToken: "<nextPageToken de la respuesta anterior>"
  }),
});
```

- Paginación: se repite la llamada con `pageToken` hasta juntar lo pedido o hasta que no haya `nextPageToken` (máximo 60 resultados por consulta).
- Los **filtros se aplican del lado propio**, después de traer los datos.
- Si tras filtrar no se llega al límite pedido, se puede repetir la búsqueda por sub-zonas (barrios) y **deduplicar por `id`**.

### Términos de uso

Google restringe el almacenamiento prolongado de datos de Places (con excepciones, como el `place_id`). La caché de este proyecto es **temporal y solo para desarrollo**. Revisar las [políticas de la plataforma](https://cloud.google.com/maps-platform/terms) antes de guardar datos de forma permanente.

---

## OpenStreetMap: Nominatim + Overpass

Funciona en dos pasos:

1. **Nominatim** convierte la zona de texto ("Merlo, Buenos Aires") en un *bounding box* (rectángulo de coordenadas).
2. **Overpass API** busca dentro de ese rectángulo los elementos con ciertos **tags**.

### Reglas de uso (fair use)

- Enviar siempre un `User-Agent` identificable (nombre de la app + contacto).
- Nominatim: **máximo 1 request por segundo**.
- No hacer consultas masivas contra los servidores públicos. Cachear.

### Ejemplo de query Overpass

```
[out:json][timeout:25];
(
  nwr["amenity"="dentist"](S,W,N,E);
  nwr["healthcare"="dentist"](S,W,N,E);
);
out center tags;
```

Se puede probar sin código en [overpass-turbo.eu](https://overpass-turbo.eu): al hacer clic en un elemento se ven todos sus tags. En openstreetmap.org se puede usar la herramienta **"Consultar elementos"** (ícono de signo de pregunta) y hacer clic sobre un polígono para ver su ficha.

### Diccionario de rubros → tags

OSM no busca por texto libre, así que cada rubro del buscador se traduce a tags:

```ts
export const RUBROS_OSM: Record<string, string[][]> = {
  dentista: [["amenity", "dentist"], ["healthcare", "dentist"]],
  farmacia: [["amenity", "pharmacy"]],
  restaurante: [["amenity", "restaurant"]],
  gimnasio: [["leisure", "fitness_centre"]],
  "cancha de futbol": [
    ["leisure", "pitch", "sport=soccer|football"],
    ["leisure", "sports_centre", "sport=soccer|football"],
  ],
  // ...completar con ~10 rubros comunes
};
```

### Mapeo de campos

Los datos en OSM pueden venir con más de un nombre de tag, hay que contemplar ambos:

| Campo propio | Tags de OSM |
|---|---|
| `name` | `name` |
| `phone` | `phone`, `contact:phone` |
| `website` | `website`, `contact:website` |
| `address` | `addr:street` + `addr:housenumber` |
| `location` | `lat/lon` (o `center` si es polígono, con `out center`) |

### Limitaciones a tener presentes

- **No hay reseñas ni rating** → con este proveedor esos filtros se deshabilitan en la UI.
- **Que falte el tag `website` no significa que el negocio no tenga web**, solo que nadie la cargó. Un "sin web" en OSM es "sin web *registrada*". Para prospección sirve como punto de partida, pero conviene validar a mano.
- Hay negocios cerrados que siguen en el mapa y negocios que nunca se cargaron.
- Los elementos pueden ser nodos, vías o relaciones (`nwr`); usar `out center` para obtener un punto en todos los casos.

---

## Modelo de datos común

Todos los proveedores devuelven este formato:

```ts
export interface Place {
  id: string;                 // id del proveedor (place_id de Google, "osm:node/123" en OSM)
  source: "google" | "osm";
  name: string;
  address?: string;
  lat?: number;
  lng?: number;
  rating?: number;            // solo Google
  reviewCount?: number;       // solo Google
  phone?: string;
  website?: string;
  mapsUrl?: string;
  openNow?: boolean;
  businessStatus?: string;    // ej. OPERATIONAL / CLOSED_PERMANENTLY
}

export interface SearchFilters {
  minReviews?: number;
  minRating?: number;
  hasWebsite?: boolean;       // true = con web, false = sin web, undefined = indistinto
  hasPhone?: boolean;
}

export interface SearchParams {
  query: string;              // rubro, ej. "dentista"
  zone: string;               // ej. "Merlo, Buenos Aires"
  limit: number;              // por defecto 50
  filters: SearchFilters;
  provider: "google" | "osm" | "auto";
}

export interface PlacesProvider {
  search(params: Pick<SearchParams, "query" | "zone" | "limit">): Promise<Place[]>;
}
```

Los filtros viven en una función pura, independiente del proveedor:

```ts
export function applyFilters(places: Place[], f: SearchFilters): Place[] {
  return places.filter((p) => {
    if (f.minReviews !== undefined && (p.reviewCount ?? 0) < f.minReviews) return false;
    if (f.minRating !== undefined && (p.rating ?? 0) < f.minRating) return false;
    if (f.hasWebsite !== undefined && Boolean(p.website) !== f.hasWebsite) return false;
    if (f.hasPhone !== undefined && Boolean(p.phone) !== f.hasPhone) return false;
    return true;
  });
}
```

> Los filtros de reseñas/rating solo tienen sentido con Google. Con OSM, la API debe ignorarlos o avisar al usuario.

---

## Stack propuesto

- **Backend:** Node.js + TypeScript (Express o Fastify), con validación de input (Zod).
- **Frontend:** React + TypeScript (Vite).
- **Caché:** archivos JSON en disco o SQLite (`better-sqlite3`) con TTL. Clave de caché = `provider + query + zone`.
- **Exportación:** CSV generado en el backend o en el cliente.
- **Config:** variables de entorno con `dotenv`.

### Estructura sugerida

```
ClientsScraper/
├─ README.md
├─ .env.example
├─ package.json            # workspaces: server, web
├─ server/
│  ├─ src/
│  │  ├─ index.ts
│  │  ├─ routes/search.ts
│  │  ├─ providers/
│  │  │  ├─ types.ts          # PlacesProvider, Place
│  │  │  ├─ google.ts
│  │  │  └─ osm.ts
│  │  ├─ filters.ts           # applyFilters
│  │  ├─ rubros.ts            # diccionario rubro -> tags OSM
│  │  ├─ cache.ts
│  │  └─ csv.ts
│  └─ tsconfig.json
└─ web/
   ├─ src/
   │  ├─ App.tsx
   │  ├─ components/
   │  │  ├─ SearchForm.tsx
   │  │  ├─ FiltersPanel.tsx
   │  │  └─ ResultsTable.tsx
   │  └─ api.ts
   └─ vite.config.ts
```

---

## API del backend

### `GET /api/search`

| Parámetro | Tipo | Ejemplo |
|---|---|---|
| `query` | string | `dentista` |
| `zone` | string | `Merlo, Buenos Aires` |
| `limit` | number | `50` |
| `provider` | `google` \| `osm` \| `auto` | `google` |
| `minReviews` | number | `20` |
| `minRating` | number | `4` |
| `hasWebsite` | boolean | `false` |
| `hasPhone` | boolean | `true` |

Respuesta:

```json
{
  "provider": "google",
  "fromCache": false,
  "total": 37,
  "results": [ { "id": "...", "name": "...", "rating": 4.6, "reviewCount": 82, "phone": "...", "website": null } ]
}
```

### `GET /api/search/export.csv`
Mismos parámetros, devuelve el CSV.

### Comportamiento de `provider=auto`
1. Intenta Google.
2. Si falla o se agotó la cuota, hace fallback a OSM y avisa en la respuesta (`"provider": "osm"`, con una advertencia de que no hay reseñas).

---

## Configuración

`.env.example`:

```
GOOGLE_PLACES_API_KEY=
OSM_USER_AGENT=ClientsScraper/0.1 (tu_email@ejemplo.com)
CACHE_TTL_HOURS=24
PORT=3001
```

`.env` va en `.gitignore`. **Nunca subir la API key.**

---

## Hoja de ruta

1. [ ] Inicializar repo, workspaces y TypeScript.
2. [ ] Definir tipos (`Place`, `SearchParams`, `PlacesProvider`) y `applyFilters` con tests.
3. [ ] Proveedor **OSM**: Nominatim + Overpass + diccionario de rubros (gratis, ideal para empezar a probar).
4. [ ] Endpoint `/api/search` con caché.
5. [ ] Frontend mínimo: formulario, filtros y tabla.
6. [ ] Proveedor **Google Places**: configurar proyecto, API key restringida, cuotas diarias y alerta de presupuesto.
7. [ ] Paginación de Google y deduplicación por `id`.
8. [ ] Modo `auto` con fallback.
9. [ ] Exportar a CSV.
10. [ ] Búsqueda por sub-zonas para superar los 60 resultados.
11. [ ] Guardar prospectos y estados de contacto.
12. [ ] Planificar recorridos: ordenar prospectos y exportar enlaces de Google Maps por tramos.
13. [ ] Horarios de apertura (`opening_hours`) como filtro y dato de la ficha.
14. [ ] Usar la geolocalización del navegador como origen del recorrido.
15. [ ] Elegir el origen haciendo clic en el mapa.
16. [ ] Recorrido ida y vuelta (`roundTrip`) al origen.
17. [ ] Terminar el recorrido en una dirección elegida.

> Sugerencia: empezar por OSM aunque Google sea el principal. Sirve para armar y probar toda la app sin tocar la facturación, y recién después se suma Google con las protecciones activadas.

---

## Decisiones y riesgos

- **Proveedores intercambiables:** permite cambiar de fuente sin tocar filtros ni UI.
- **Filtros del lado propio:** ninguna de las dos fuentes filtra bien por web/teléfono/reseñas a la vez.
- **Cuotas y caché primero:** mientras se aprende es fácil gastar requests sin querer.
- **Calidad de datos:** el filtro "sin web" es confiable con Google y orientativo con OSM.
- **Uso responsable:** los datos son de negocios públicos, pero para contactarlos hay que respetar la normativa vigente de datos personales y de comunicaciones comerciales (en Argentina, la Ley 25.326 de Protección de Datos Personales y el registro "No llame").

---

## Referencias

- [Google Maps Platform: precios](https://developers.google.com/maps/billing-and-pricing/pricing)
- [Google Maps Platform: categorías de precios y cupos gratuitos](https://developers.google.com/maps/billing-and-pricing/pricing-categories)
- [Places API (New): Text Search](https://developers.google.com/maps/documentation/places/web-service/text-search)
- [Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API) y [overpass-turbo](https://overpass-turbo.eu)
- [Nominatim: política de uso](https://operations.osmfoundation.org/policies/nominatim/)
- [OSM Map Features](https://wiki.openstreetmap.org/wiki/Map_features) (lista de tags por tipo de lugar)