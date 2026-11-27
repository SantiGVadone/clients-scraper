---
name: frontend-redesign
description: Guía para diseñar y rediseñar el frontend de ClientsScraper (React + Vite + TypeScript) con identidad propia, buena usabilidad, animación en scroll y accesibilidad. Usar al crear o modificar cualquier pantalla, componente, estilo o animación dentro de web/.
---

# Rediseño del frontend de ClientsScraper

## A quién le diseñamos

Un emprendedor que quiere salir a vender (por ejemplo, un programador que ofrece páginas web) y necesita saber **a qué negocios ir, en qué orden y con qué datos de contacto**. No es una persona técnica de datos: no conoce "providers", "caché" ni "capabilities". La interfaz habla su idioma y le deja claro en cada momento qué hacer.

El flujo central tiene tres momentos y el diseño tiene que hacerlos evidentes sin explicarlos:
1. Buscar un rubro en una zona.
2. Filtrar y elegir a quién visitar.
3. Recibir el recorrido ordenado y llevárselo (mapa y enlaces por tramo).

## Proceso obligatorio: plan, revisión, construcción, crítica

1. **Plan corto antes de tocar código.** Definí un sistema de tokens compacto:
   - Color: 4 a 6 valores hex con nombre y rol (base, texto, acento, y el resto solo si cumplen una función).
   - Tipografía: una o dos familias con roles claros; si son dos, que se distingan de verdad. Escala tipográfica definida (tamaños, pesos, interlineado).
   - Layout: un concepto en una oración y un wireframe ASCII para escritorio y otro para celular. Indicá alineaciones.
   - Principios: qué hace único a este diseño.
2. **Revisá el plan contra los defaults.** Si alguna parte es lo que producirías para cualquier otra app de este tipo, cambiala y decí qué cambiaste y por qué.
3. **Construí por fases pequeñas**, corriendo typecheck y build al cerrar cada una.
4. **Criticá el resultado.** Si el entorno permite capturas, mirá la pantalla en 360 px, 768 px y 1280 px. Antes de terminar, sacá un adorno: lo que no sirve a la tarea, se va.

## Evitar el aspecto de "plantilla generada"

Estos son defaults, no decisiones. Evitalos salvo que el brief los pida:
- Fondo crema con serif de alto contraste y acento terracota.
- Fondo casi negro con un único acento verde ácido o bermellón.
- Contenido partido en tarjetas idénticas con el mismo radio de borde, la misma sombra gris suave y lavados de gradiente como decoración.
- Etiquetas en mayúsculas con espaciado ancho sobre cada título; textos unidos con puntos medios; etiquetas tipo "PALABRA — fragmento"; flechas "→" pegadas a cada botón.
- Resaltar una sola palabra de un titular con otro color o cursiva.
- Íconos en emoji, degradés en botones, glassmorphism sin motivo.
- Numeración "01 / 02 / 03" donde el contenido no es una secuencia. (Las paradas del recorrido **sí** son una secuencia: ahí numerar es información, no decoración.)
- Tipografías que se eligen por reflejo en cualquier proyecto (Inter, Roboto, Space Grotesk, system-ui por defecto).

Las decisiones de diseño salen del tema real del producto: rutas, zonas, negocios de barrio, hojas de ruta, mapas. Usá ese vocabulario visual.

## Usabilidad

- **Un solo punto de foco por pantalla:** la acción principal es obvia y única.
- **Lenguaje del usuario:** "Buscar negocios", "Con teléfono", "Sin sitio web", "Armar recorrido". No expongas vocabulario interno (provider, caché, capabilities, auto). Lo técnico va en una sección "Avanzado" plegada.
- **Voseo rioplatense consistente** ("Buscá", "Elegí", "Calculá"), oraciones en minúscula salvo la inicial, verbos activos. Un botón dice exactamente lo que hace, y esa acción se llama igual en todo el flujo.
- **Filtros como controles rápidos** (interruptores o chips: "Sin web", "Con teléfono", mínimo de reseñas), con el resultado actualizándose y la cantidad visible. Los filtros no soportados por el proveedor activo se ven deshabilitados con una razón corta, no desaparecen.
- **Estados completos:** vacío (invita a actuar), cargando (esqueletos, no solo un texto), error (qué pasó y cómo seguir, sin disculpas ni jerga) y éxito.
- **Resultados legibles en celular:** en pantallas angostas la tabla se transforma en lista de fichas con lo importante primero (nombre, teléfono accionable, estado de web, rating). Teléfono con `tel:`, mapa y web como acciones claras.
- **Sin información duplicada:** si dos bloques muestran lo mismo, quedate con uno.
- **El mapa no vive escondido al final de la página:** el recorrido y su mapa se leen juntos.
- **Orientación:** el usuario siempre sabe en qué paso está y qué sigue.

## Animación

- **Un momento orquestado, no efectos en todos lados.** Evitá el "fade y slide hacia arriba en cada sección" y los hover animados en cada tarjeta.
- **Animación atada al scroll (pedido del proyecto):** elegí una sola idea fuerte y coherente con el tema, por ejemplo que la línea del recorrido se dibuje a medida que se baja por las paradas, con cada parada activándose al entrar en pantalla. Además, un encabezado que se compacta al hacer scroll es válido porque libera espacio.
- **Implementación:** CSS puro con `animation-timeline: view()` o `scroll()` dentro de `@supports`, y un respaldo con `IntersectionObserver` (una sola instancia, sin escuchar `scroll` a mano) o directamente el estado final estático en navegadores que no lo soportan. Animá solo `transform` y `opacity` (o `stroke-dashoffset` en SVG). Sin secuestrar el scroll.
- **Movimiento que responde a una acción** (expandir, confirmar, agregar una parada) es bienvenido si muestra qué cambió y dura entre 150 y 300 ms.
- **`prefers-reduced-motion: reduce` siempre respetado:** todo queda en su estado final, sin movimiento.
- Sin librerías de animación pesadas (GSAP, Framer Motion) salvo justificación explícita.

## Calidad mínima (no se anuncia, se cumple)

- Responsive desde 360 px de ancho, sin scroll horizontal de página.
- Foco de teclado siempre visible, orden de tabulación lógico, todo operable sin mouse.
- Contraste AA como mínimo; el color nunca es el único portador de significado.
- Áreas táctiles de al menos 44 × 44 px.
- Etiquetas asociadas a cada campo; resultados anunciados con `aria-live="polite"`; el mapa con alternativa textual (la lista ordenada).
- Sin saltos de layout al cargar (reservar el espacio de mapa y resultados).
- `lang="es"`, título de página descriptivo.

## Restricciones técnicas del proyecto

- Trabajá solo dentro de `web/`. **No modifiques `server/`**, ni los contratos de la API, ni los tests del backend.
- Mantené React + TypeScript (`strict`) + Vite y Leaflet. El mapa sigue siendo imperativo; podés restilizar marcadores, línea y controles. Se permite suavizar o desaturar los tiles con CSS para que la ruta destaque.
- CSS propio (variables CSS para los tokens). Sin kits de componentes ni plantillas que impongan su aspecto (MUI, Chakra, etc.).
- Tipografías autoalojadas con paquetes `@fontsource` o `@fontsource-variable`, no por CDN. Verificá que existan los pesos y ejes que uses, y mantené pocos archivos.
- Cada dependencia nueva se justifica en una línea. Cuidá el tamaño del bundle.
- La UI sigue leyendo `/api/providers` para saber qué filtros están disponibles. Si el proveedor no soporta reseñas o rating, esos controles quedan deshabilitados.
- Si existen tests en `web/`, tienen que seguir pasando.

## Entrega

Al cerrar cada fase corré `npm run typecheck` y `npm run build`, y listá en pocas líneas qué cambió y qué decisiones de diseño tomaste.
