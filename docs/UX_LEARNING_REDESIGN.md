# UX Learning Redesign (February 12, 2026)

This redesign prioritizes learning throughput over UI ornamentation. The objective is to reduce cognitive friction and keep users inside an evidence-based practice loop.

## Applied principles

- Progressive disclosure for practice flow:
  - show one active stage and immediate next action,
  - reduce simultaneous decision load in guided practice.
- Immediate, legible feedback:
  - explicit status for active stage,
  - clear unlock reasons and completion criteria.
- Accessible interaction targets and focus visibility:
  - preserve high-visibility focus rings,
  - keep controls at touch-friendly sizes.
- Responsiveness and performance:
  - keep heavy panels lazy-loaded,
  - preserve bundle budgets to protect interaction latency.
- Coherent state transitions:
  - stage progression is event-driven and deterministic,
  - avoid hidden side effects distributed across UI components.

## UX updates implemented

- Added a top-level learning focus banner to communicate current objective and next stage.
- Redesigned guided practice into:
  - mission card,
  - compact stage rail,
  - active-stage action panel.
- Consolidated progression logic into pure domain transitions (`progressEvents`) to keep hooks thin and testable.
- Mobile panel selector now uses ARIA `tablist`/`tab` semantics with `tabpanel` linkage.
- Redesigned learning path panel with:
  - overall mastery radar,
  - per-unit timeline visualization,
  - unlock and level completion signals.
- Maintained strict evidence-based progression logic (no manual completion shortcuts).

## Source references

- WCAG 2.2 recommendation and updates:
  - https://www.w3.org/TR/WCAG22/
  - https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/
- Core Web Vitals and INP guidance (INP replaced FID in March 2024):
  - https://web.dev/inp/
  - https://web.dev/blog/inp-cwv-launch
- React guidance for state structure and reducer extraction:
  - https://react.dev/learn/choosing-the-state-structure
  - https://react.dev/learn/extracting-state-logic-into-a-reducer
- Universal Design for Learning 3.0 (learning accessibility):
  - https://udlguidelines.cast.org/
- WAI-ARIA Authoring Practices (Tabs pattern):
  - https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
- Evidence on metacognition and self-regulated learning:
  - https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/metacognition-and-self-regulation
- Evidence on mastery learning:
  - https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/mastery-learning
