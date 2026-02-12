# Curriculum and UX Criteria

This project treats learning as a single integral system (theory order + guided practice + runtime feedback), not as an isolated exercise pack.

## Academic alignment (UCV-oriented)

- The learning path is organized in progressive units aligned with first-cycle programming formation used in UCV curricula:
  - fundamentals and control flow first
  - data structures and modularity next
  - classic algorithms afterwards
- The in-app sequence is represented in `practiceUnits` and consumed by the playground as the default learning route.
- Web references consulted on February 12, 2026:
  - UCV curricular brochure:
    - https://adminwebdesarrollo.ucv.edu.pe/uploads/files/Ingenier%C3%ADa_de_Sistemas_a_distancia.pdf
  - UCV systems engineering profile/news page:
    - https://www.ucv.edu.pe/noticias/que-necesito-saber-para-estudiar-ingenieria-de-sistemas

## Curriculum scope implemented

- Unit 1: Variables, constants, operators, input/output.
- Unit 2: `Si`, `Segun`, `Para`, `Mientras`, `Repetir ... Hasta Que`.
- Unit 3: Vectors and matrices (1-based indexing).
- Unit 4: Strings, functions, procedures, and parameters by reference.
- Unit 5: Sequential/binary search and sorting (bubble/insertion/selection).

## Frontend architecture criteria

- Feature-first structure (`model`, `ui`, `hooks`) keeps responsibilities isolated.
- Curriculum metadata is centralized in `src/features/runtime/model/practiceExercises.ts`.
- UI rendering uses derived selectors (`getPracticeExercisesByUnitId`, `getPracticeUnitById`) to keep state transitions deterministic.
- Data integrity is protected with tests in `src/features/runtime/model/practiceExercises.spec.ts`.
- Modularity baseline:
  - React component hierarchy and state ownership patterns:
    - https://react.dev/learn/thinking-in-react
  - JS/TS module boundaries and type-safe exports:
    - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules
    - https://www.typescriptlang.org/docs/handbook/project-references.html

## Accessibility and UX criteria

- Learning order and coverage are explicit through unit cards, completion percentage, and topic status badges.
- Practice panel includes objective, instructions, expected output, and estimated effort to reduce ambiguity for beginners.
- Accessibility baseline follows WCAG 2.2 guidance.
- Sources:
  - https://www.w3.org/TR/WCAG22/
  - https://www.w3.org/WAI/news/2023-10-05/wcag22rec/

## Performance and maintainability criteria

- Expensive panels remain lazy-loaded and hydratable on demand.
- Responsiveness and interaction quality target current Core Web Vitals guidance (INP).
- React state derivation follows official guidance to avoid unnecessary effects.
- JavaScript payload strategy follows code-splitting guidance for better responsiveness:
  - https://web.dev/learn/performance/code-split-javascript
- Sources:
  - https://web.dev/inp/
  - https://react.dev/learn/you-might-not-need-an-effect

## PSeInt syntax compatibility references

- Official project metadata and releases:
  - https://sourceforge.net/projects/pseint/
- Official syntax/help pages:
  - https://pseint.sourceforge.net/index.php?page=pseudocodigo.php
  - https://pseint.sourceforge.net/index.php?page=subprocesos.php
