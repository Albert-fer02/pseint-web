# Stack Decision 2026 Q1

## Contexto

El producto es una plataforma educativa altamente interactiva (editor, runtime en worker, paneles de aprendizaje, progreso y evaluacion) desplegada en GitHub Pages.

El equipo evaluo migrar de `Vite + React + TanStack Router` hacia `TanStack Start`.

## Decision

Mantener `Vite + React + TanStack Router` y fortalecer calidad con `Vitest + cobertura en CI`.

## Razones

- El deploy actual es estatico (GitHub Pages). `TanStack Start` aporta mas valor cuando hay SSR/server functions.
- El costo de migracion hoy supera el beneficio para el roadmap pedagogico (interactividad, ejercicios, UX, performance).
- La arquitectura actual ya soporta separacion modular por dominio y testing incremental.

## Implicaciones

- Se mantiene compatibilidad directa con Pages sin backend obligatorio.
- Las pruebas unitarias quedan con cobertura trazable (`test:coverage`).
- Se prioriza evolucion funcional y pedagogica sobre cambios de framework.

## Criterios para reevaluar TanStack Start

Revisar migracion cuando se cumpla al menos uno:

1. Necesidad de SSR/streaming para SEO o contenido inicial critico.
2. Uso intensivo de funciones de servidor (persistencia, auth, evaluacion remota).
3. Cambio de hosting a entorno con runtime server (Node/Workers/Vercel/Cloudflare).

## Fecha

- Decision vigente: 12 de febrero de 2026.
