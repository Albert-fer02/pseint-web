# Design Spec v1

## Objetivo
Definir una fuente de verdad de UI/UX para evitar inconsistencias mientras el producto escala.

## Principios
1. Coherencia primero: una sola metafora visual por jerarquia.
2. Claridad sobre ornamento: texto y acciones siempre legibles.
3. Ergonomia movil: accion principal en zona inferior para uso con una mano.
4. Accesibilidad por defecto: contraste, foco visible, teclado y reduced-motion.
5. Performance consciente: cargar pesado bajo demanda.

## Sistema Visual

### Tokens semanticos
- Superficies: `background`, `card`, `popover`.
- Texto: `foreground`, `muted-foreground`.
- Accion: `primary`, `secondary`, `accent`.
- Estado: `destructive`.
- Estructura: `border`, `input`, `ring`.

### Temas soportados
- `theme-light`: lectura larga y contraste alto.
- `theme-oled`: negro real para pantallas OLED y baja fatiga nocturna.

### Reglas de composicion
- No mezclar "glassmorphism" y planos densos en la misma profundidad.
- Cards siempre con borde + sombra suave + radio consistente.
- CTA primario con mayor contraste que acciones secundarias.

## Motion
- Duraciones:
  - Fast `160ms`
  - Base `240ms`
  - Slow `360ms`
- Easing:
  - Standard `cubic-bezier(0.2,0,0,1)`
  - Spring-like `cubic-bezier(0.22,1,0.36,1)`
- Reduced motion:
  - Si `prefers-reduced-motion: reduce`, minimizar animaciones y transiciones.

## Ergonomia y Layout
- Mobile:
  - Accion principal fija abajo (dock) para alcance de pulgar.
  - Contenido deja espacio inferior para no ocultarse detras del dock.
- Desktop:
  - CTA visible en contexto del editor.

## Accesibilidad (QA minima)
1. Contraste:
   - Texto normal >= `4.5:1`
   - Texto grande y componentes UI >= `3:1`
2. Foco visible en teclado para botones, inputs y toggles.
3. Skip link presente para saltar al contenido principal.
4. Touch targets recomendados: min 44x44 CSS px para controles tactiles.

## Arquitectura UI
- `shared/ui/*`: componentes base estilo shadcn (`button`, `card`, `input`, `badge`).
- `features/theme/*`: selector de tema y provider.
- `pages/*`: composicion de casos de uso, no logica de bajo nivel.
- `shared/lib/*`: utilidades, parser/runtime/flowchart.

## Checklist de PR
1. ¿Reusa tokens semanticos en vez de colores hardcodeados?
2. ¿Mantiene contraste y foco visible en ambos temas?
3. ¿Respeta la regla de accion principal ergonomica en mobile?
4. ¿Evita nuevas dependencias pesadas sin lazy loading?
5. ¿Pasa `lint`, `typecheck`, `test`, `build`?

## Referencias
- shadcn/ui - Theming: https://ui.shadcn.com/docs/theming
- Tailwind CSS - Dark mode: https://tailwindcss.com/docs/dark-mode
- WCAG 2.2 - Contrast (Minimum): https://www.w3.org/TR/WCAG22/#contrast-minimum
- MDN - prefers-reduced-motion: https://developer.mozilla.org/docs/Web/CSS/@media/prefers-reduced-motion
