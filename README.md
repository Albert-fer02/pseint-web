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
bun run build
```

## Deploy en GitHub Pages

- El workflow esta en `.github/workflows/deploy-pages.yml`.
- Hace deploy automatico al hacer `push` a `main`.
- El `base` se calcula automaticamente en CI con el nombre del repo.

Pasos:

1. Sube este proyecto a un repo de GitHub.
2. Ve a `Settings -> Pages` y en `Source` selecciona `GitHub Actions`.
3. Haz push a `main` y espera el workflow `Deploy to GitHub Pages`.

Importante:

- No subas API keys reales al frontend (`VITE_*`), porque quedan expuestas en el navegador.

## Funcionalidades MVP

- Editor de pseudocodigo con ejemplo precargado.
- Resaltado de sintaxis PSeInt (keywords, tipos, funciones, operadores, comentarios, strings).
- Atajo de ejecucion `Ctrl/Cmd + Enter`.
- Deteccion de entradas a partir de `Leer`.
- Parser y runtime basico (`Definir`, `Leer`, `Escribir`, asignaciones, `Si/Sino`, `Subcadena`).
- Salida de consola y snapshot de variables finales.
- Analisis automatico en vivo: nivel (`Basico/Intermedio/Avanzado`), complejidad, nesting, ciclomatica y recomendaciones.
- Diagrama de flujo live generado desde AST mientras editas.
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

Incluye tokens, motion, ergonomia movil, checklist de accesibilidad y reglas de coherencia visual.

## Notas de escalabilidad

- Runtime aislado en worker para no bloquear UI.
- Mermaid cargado con lazy import.
- AI Orchestrator con chain de proveedores (`gemini -> openai -> mock`) y cache local por contenido.
- Seguridad: la integracion actual es client-side para prototipo; en produccion usar backend para proteger llaves.
- Proximo paso recomendado:
  - lazy load del editor para bajar TTI inicial
  - separar panel de diagrama en ruta/modal on-demand
