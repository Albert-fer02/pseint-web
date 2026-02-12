# PSeInt Web Lab

Editor educativo para pseudocodigo estilo PSeInt con:

- ejecucion en navegador (Web Worker)
- diagrama Mermaid autogenerado
- UI modular estilo `shadcn/ui`
- modo `light` y `OLED dark`

## Stack

- `Bun` + `Vite` + `React 19` + `TypeScript`
- `Tailwind CSS v4` (tokens semanticos por variables CSS)
- `TanStack Router`
- `CodeMirror`
- `Mermaid`
- `Vitest` + `Testing Library`

## Ejecutar

```bash
bun install
bun dev
```

Configurar IA (opcional):

```bash
cp .env.example .env.local
```

Validacion de calidad:

```bash
bun run lint
bun run typecheck
bun run test
bun run test:e2e
bun run build
bun run check:bundle
```

Pipeline local completo:

```bash
bun run ci
```

## Deploy en GitHub Pages

- El workflow esta en `.github/workflows/deploy-pages.yml`.
- Hace deploy automatico al hacer `push` a `main`.
- El `base` se calcula automaticamente en CI con el nombre del repo.
- Antes de publicar, ejecuta quality gates (`typecheck`, `lint`, `test`, `build`, `check:bundle`).

CI general:

- `.github/workflows/ci.yml` valida lo mismo en `push` y `pull_request`.
- `.github/workflows/e2e-mobile.yml` corre regresiones responsive en viewport movil con Playwright.

Pasos:

1. Sube este proyecto a un repo de GitHub.
2. Ve a `Settings -> Pages` y en `Source` selecciona `GitHub Actions`.
3. Haz push a `main` y espera el workflow `Deploy to GitHub Pages`.

Importante:

- No subas API keys reales al frontend (`VITE_*`), porque quedan expuestas en el navegador.

## Funcionalidades MVP

- Editor de pseudocodigo con ejemplo precargado.
- Autosave por proyecto en localStorage (crear, renombrar, eliminar y cambiar de proyecto).
- Carga de ejemplos rapidos desde selector.
- Ruta integral por unidades (fundamentos, control, estructuras, modularidad y algoritmos) con progreso.
- Contenido de practica modularizado por unidad (`src/features/runtime/model/practice/exercises/*`).
- Resaltado de sintaxis PSeInt (keywords, tipos, funciones, operadores, comentarios, strings).
- Autocompletado PSeInt con snippets rapidos.
- Formateo basico de pseudocodigo.
- Atajo de ejecucion `Ctrl/Cmd + Enter`.
- Deteccion de entradas a partir de `Leer`.
- Parser y runtime con soporte de curso (`Definir`, `Constante`, `Leer`, `Escribir`, asignaciones, `Si/Sino`, `Segun`, ciclos, funciones y `SubProceso` con parametros por referencia).
- Salida de consola y snapshot de variables finales.
- Analisis automatico en vivo: nivel (`Basico/Intermedio/Avanzado`), complejidad, nesting, ciclomatica y recomendaciones.
- Diagrama de flujo live generado desde AST mientras editas.
- Vista expandida del diagrama para mobile.
- Tema visual persistido en `localStorage`.
- Dock movil con accion principal en zona ergonomica inferior.
- Tutor IA (Gemini-first) con fallback OpenAI y fallback mock local.

## Arquitectura

```text
src/
  app/                 # bootstrap, router y providers globales
  pages/               # composicion de pantallas
  features/            # casos de uso UI/runtime/theme
  entities/            # tipos de dominio
  shared/lib/pseint/   # parser, interpreter, analyzer, flowchart
  shared/ui/           # componentes base estilo shadcn
  workers/             # ejecucion aislada del runtime
```

## Fuente de verdad de diseño

- `docs/DESIGN_SPEC_V1.md`
- `docs/CURRICULUM_ARCHITECTURE.md`

Incluye tokens, motion, ergonomia movil, checklist de accesibilidad y reglas de coherencia visual.

## Notas de escalabilidad

- Runtime aislado en worker para no bloquear UI.
- Mermaid cargado con lazy import y con hidratacion diferida en el panel de diagrama.
- Analisis de codigo desacoplado de la escritura (deferred rendering) para evitar jank.
- AI Orchestrator con chain de proveedores (`gemini -> openai -> mock`) y cache local por contenido.
- Budgets de bundle automatizados para evitar regresiones de performance.
- Seguridad: la integracion actual es client-side para prototipo; en produccion usar backend para proteger llaves.
- Proximo paso recomendado:
  - lazy load del editor para bajar TTI inicial
  - separar panel de diagrama en ruta/modal on-demand
