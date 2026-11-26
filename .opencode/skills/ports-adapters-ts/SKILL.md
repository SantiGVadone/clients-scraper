---
name: ports-adapters-ts
description: Arquitectura por capas con puertos y adaptadores (hexagonal liviana) para backends Node.js + TypeScript. Usar al crear o modificar rutas, controllers, services, providers externos (OSM, Google Places), repositorios, caché o tests en ClientsScraper.
---

# Arquitectura: capas + puertos y adaptadores

Objetivo: que los datos puedan venir de cualquier proveedor (hoy OpenStreetMap, mañana Google Places API) sin tocar la lógica de negocio, los filtros ni el frontend.

## Regla de dependencias (la más importante)

Las dependencias apuntan siempre hacia adentro:

http (routes → controllers) → application (services) → domain
                                       ↓
                                    ports (interfaces)
                                       ↑
                    infrastructure (adapters: OSM, Google, caché, CSV)

- `domain` no importa nada de afuera: ni Express, ni fetch, ni librerías.
- `application` solo conoce `domain` y las **interfaces** (ports). Nunca importa un adapter concreto.
- `infrastructure` implementa los ports. Es lo único que sabe de HTTP externo, Overpass, Google o el disco.
- `http` traduce request/response. No tiene lógica de negocio.
- El cableado (qué adapter se usa) se hace en un único lugar: `composition-root.ts`.

## Estructura

server/src/
├─ domain/
│  ├─ place.ts              # entidad Place
│  ├─ search.ts             # SearchParams, SearchFilters
│  ├─ filters.ts            # applyFilters (función pura)
│  └─ errors.ts             # errores de dominio tipados
├─ application/
│  ├─ ports/
│  │  ├─ places-provider.ts # interface PlacesProvider
│  │  ├─ search-cache.ts    # interface SearchCache
│  │  └─ geocoder.ts        # interface Geocoder (si hace falta)
│  └─ services/
│     ├─ search-places.service.ts
│     └─ export-places.service.ts
├─ infrastructure/
│  ├─ providers/
│  │  ├─ osm/               # osm-provider.ts, overpass-client.ts, nominatim-client.ts, osm-mapper.ts, rubros.ts
│  │  └─ google/            # google-places-provider.ts, google-mapper.ts
│  ├─ cache/                # file-cache.ts (implementa SearchCache)
│  └─ csv/                  # csv-exporter.ts
├─ http/
│  ├─ routes/
│  ├─ controllers/
│  └─ schemas/              # validación de input (Zod)
├─ config/env.ts            # lectura y validación de variables de entorno
├─ composition-root.ts      # arma providers, cache y services
└─ index.ts

## Cómo se agrega un proveedor nuevo

1. Crear `infrastructure/providers/<nombre>/` con una clase que implemente `PlacesProvider`.
2. Separar el **mapper** (respuesta externa → `Place`) del cliente HTTP, para poder testearlo con fixtures.
3. Registrarlo en `composition-root.ts` bajo una clave (`"osm" | "google"`).
4. No debe cambiar ni una línea de `domain/` ni de `application/`. Si hace falta cambiarlas, el diseño del port estaba mal: arreglar el port, no hacer excepciones.

## Reglas del dominio

- `Place` es el formato común. Los campos que un proveedor no tiene (ej: `rating` y `reviewCount` en OSM) son **opcionales y quedan en `undefined`**, nunca se inventan.
- Cada provider declara sus **capacidades** (`capabilities: { reviews: boolean }`) para que la UI y la API sepan qué filtros aplican. Si un filtro no es soportado por el provider activo, se informa en la respuesta; no se ignora en silencio.
- Los filtros (`applyFilters`) son funciones puras en `domain/`, independientes del proveedor.
- Un "sin web" en OSM significa "sin web registrada" y debe quedar documentado en la respuesta (campo `warnings`).

## Controllers y services

- Controller: valida input con Zod, llama a un service, devuelve DTO. Sin lógica de negocio.
- Service: orquesta (caché → provider → filtros → límite). Recibe sus dependencias **por constructor** (inyección manual, sin frameworks de DI).
- Repository: reservado para persistencia propia (caché, y a futuro prospectos guardados). Los proveedores externos son **providers/adapters**, no repositories.

## Errores

- Errores de dominio tipados (`ProviderUnavailableError`, `ZoneNotFoundError`, `QuotaExceededError`, `UnsupportedFilterError`).
- Los adapters traducen errores técnicos (timeouts, 429, 5xx) a errores de dominio.
- Un middleware en `http/` los mapea a códigos HTTP. Nunca devolver stack traces al cliente.

## Reglas específicas de OSM

- Enviar siempre `User-Agent` identificable (viene de `config/env.ts`).
- Nominatim: máximo 1 request por segundo. Implementar un rate limiter simple en el cliente.
- Cachear siempre: la clave es `provider + query + zone`. Los servidores públicos son gratuitos y se cuidan.
- `out center tags` para obtener un punto en nodos, vías y relaciones.
- Leer `phone` y `contact:phone`, `website` y `contact:website`.

## Reglas específicas de Google Places (para cuando se implemente)

- Usar Places API (New), Text Search, con `FieldMask` mínimo. Cada campo extra puede subir la categoría de precio.
- La API key solo vive en variables de entorno. Nunca en el repo ni en logs.
- Paginar con `pageToken` hasta el límite pedido (máximo 60 resultados por consulta) y deduplicar por `id`.
- Respetar el cupo: contar requests y fallar con `QuotaExceededError` antes de gastar de más.

## Tests

- `domain/`: tests unitarios puros (filtros).
- Mappers: tests con fixtures JSON reales de Overpass/Google guardadas en `__fixtures__/`.
- Services: tests con providers y caché falsos (fakes en memoria). No pegarle a la red real en los tests.
- Usar Vitest.

## Estilo

- TypeScript `strict: true`. Sin `any`.
- Nombres de archivos en kebab-case. Un concepto por archivo.
- No sobre-ingenierizar: sin clases ni capas que no aporten. Si un service es una función simple, que sea una función.