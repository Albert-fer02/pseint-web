import { lazy, Suspense, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import type { RuntimeInputField } from '@/entities/pseint/model/types'
import { PseudocodeEditor } from '@/features/editor/ui/PseudocodeEditor'
import { usePseintRuntime } from '@/features/runtime/hooks/usePseintRuntime'
import { defaultInputs, defaultProgram } from '@/features/runtime/model/defaultProgram'
import {
  createDefaultPracticeProgressEntry,
  getPracticeExerciseById,
  getPracticeProgressEntry,
  loadPracticeProgress,
  practiceExercises,
  savePracticeProgress,
  type PracticeProgress,
} from '@/features/runtime/model/practiceExercises'
import { RuntimeInputsForm } from '@/features/runtime/ui/RuntimeInputsForm'
import { RuntimeOutputPanel } from '@/features/runtime/ui/RuntimeOutputPanel'
import { extractInputFields } from '@/shared/lib/pseint/analyzer'
import { getPseintErrorHint } from '@/shared/lib/pseint/errorHints'
import { buildFlowchart } from '@/shared/lib/pseint/flowchart'
import { analyzeProgram } from '@/shared/lib/pseint/insights'
import { parseProgram } from '@/shared/lib/pseint/parser'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'

const ProgramInsightsPanel = lazy(() =>
  import('@/features/analysis/ui/ProgramInsightsPanel').then((module) => ({ default: module.ProgramInsightsPanel })),
)
const AiTutorPanel = lazy(() => import('@/features/ai/ui/AiTutorPanel').then((module) => ({ default: module.AiTutorPanel })))
const MermaidChart = lazy(() => import('@/shared/lib/mermaid/MermaidChart'))

const initialExerciseId = practiceExercises[0]?.id ?? ''
type MobilePanelKey = 'practice' | 'inputs' | 'insights' | 'output' | 'diagram' | 'ai'
const mobilePanels: Array<{ key: MobilePanelKey; label: string }> = [
  { key: 'practice', label: 'Practica' },
  { key: 'inputs', label: 'Entradas' },
  { key: 'output', label: 'Salida' },
  { key: 'insights', label: 'Metricas' },
  { key: 'diagram', label: 'Diagrama' },
  { key: 'ai', label: 'Tutor IA' },
]
const MOBILE_PANEL_SCROLL_ID_PREFIX = 'mobile-panel'
const MOBILE_KEYBOARD_DELTA_THRESHOLD = 140

function getMobilePanelSectionId(panel: MobilePanelKey): string {
  return `${MOBILE_PANEL_SCROLL_ID_PREFIX}-${panel}`
}

export function PlaygroundPage() {
  const [source, setSource] = useState(defaultProgram)
  const deferredSource = useDeferredValue(source)
  const [inputs, setInputs] = useState<Record<string, string>>(defaultInputs)
  const [selectedExerciseId, setSelectedExerciseId] = useState(initialExerciseId)
  const [mobilePanel, setMobilePanel] = useState<MobilePanelKey>('inputs')
  const [practiceProgress, setPracticeProgress] = useState<PracticeProgress>(() => loadPracticeProgress())
  const hasMountedMobilePanelEffectRef = useRef(false)
  const diagramSectionRef = useRef<HTMLDivElement | null>(null)
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const [shouldHydrateDiagram, setShouldHydrateDiagram] = useState(false)

  const { run, reset, status, result, error } = usePseintRuntime()

  const selectedExercise = useMemo(() => getPracticeExerciseById(selectedExerciseId), [selectedExerciseId])

  const selectedProgress = useMemo(() => {
    if (!selectedExercise) {
      return createDefaultPracticeProgressEntry()
    }

    return getPracticeProgressEntry(practiceProgress, selectedExercise.id)
  }, [practiceProgress, selectedExercise])

  const { inputFields, parserError, flowchartPreview, insights } = useMemo(() => {
    try {
      const ast = parseProgram(deferredSource)
      return {
        inputFields: extractInputFields(ast),
        parserError: null,
        flowchartPreview: buildFlowchart(ast),
        insights: analyzeProgram(deferredSource, ast),
      }
    } catch (parseError) {
      return {
        inputFields: [],
        parserError: parseError instanceof Error ? parseError.message : 'Error de parseo.',
        flowchartPreview: null,
        insights: null,
      }
    }
  }, [deferredSource])

  const isAnalysisPending = source !== deferredSource

  const parserHint = useMemo(() => (parserError ? getPseintErrorHint(parserError) : null), [parserError])

  const syncInputsWithSource = (nextSource: string, fallbackInputs: Record<string, string>) => {
    try {
      const ast = parseProgram(nextSource)
      const fields = extractInputFields(ast)
      setInputs(keepOnlyExpectedInputs(fallbackInputs, fields))
    } catch {
      setInputs(fallbackInputs)
    }
  }

  const applyProgramTemplate = (nextSource: string, nextInputs: Record<string, string>) => {
    setSource(nextSource)
    syncInputsWithSource(nextSource, nextInputs)
    reset()
  }

  const handleSourceChange = (nextSource: string) => {
    setSource(nextSource)
    try {
      const ast = parseProgram(nextSource)
      const fields = extractInputFields(ast)
      setInputs((currentInputs) => keepOnlyExpectedInputs(currentInputs, fields))
    } catch {
      // keep previous inputs while user edits invalid code
    }
  }

  const updatePracticeProgress = (updater: (current: PracticeProgress) => PracticeProgress) => {
    setPracticeProgress((current) => {
      const next = updater(current)
      savePracticeProgress(next)
      return next
    })
  }

  const markExerciseAttempt = (exerciseId: string) => {
    updatePracticeProgress((current) => {
      const currentEntry = getPracticeProgressEntry(current, exerciseId)
      return {
        ...current,
        [exerciseId]: {
          ...currentEntry,
          attempts: currentEntry.attempts + 1,
          lastAttemptAt: new Date().toISOString(),
        },
      }
    })
  }

  const markExerciseCompleted = (exerciseId: string) => {
    updatePracticeProgress((current) => {
      const currentEntry = getPracticeProgressEntry(current, exerciseId)
      return {
        ...current,
        [exerciseId]: {
          ...currentEntry,
          completed: true,
          completedAt: currentEntry.completedAt ?? new Date().toISOString(),
        },
      }
    })
  }

  const loadSelectedExercise = () => {
    if (!selectedExercise) {
      return
    }

    applyProgramTemplate(selectedExercise.starterCode, selectedExercise.starterInputs)
  }

  const loadSelectedSolution = () => {
    if (!selectedExercise) {
      return
    }

    applyProgramTemplate(selectedExercise.solutionCode, selectedExercise.starterInputs)
  }

  const resetPractice = () => {
    savePracticeProgress({})
    setPracticeProgress({})
  }

  const runProgram = async () => {
    if (parserError) {
      return
    }

    if (selectedExercise) {
      markExerciseAttempt(selectedExercise.id)
    }

    try {
      const runtimeResult = await run(source, inputs)
      if (
        selectedExercise &&
        selectedExercise.expectedOutputLines &&
        isExpectedOutputMatch(runtimeResult.execution.outputs, selectedExercise.expectedOutputLines)
      ) {
        markExerciseCompleted(selectedExercise.id)
      }
      setMobilePanel('output')
    } catch {
      // runtime errors are already reflected in hook state
      setMobilePanel('output')
    }
  }

  const runButtonText = status === 'running' ? 'Ejecutando...' : 'Ejecutar programa'
  const isRunDisabled = status === 'running' || Boolean(parserError)
  const panelClass = (panel: MobilePanelKey) => (mobilePanel === panel ? 'block' : 'hidden md:block')
  const shouldRenderInsights = isDesktop || mobilePanel === 'insights'
  const shouldRenderAi = isDesktop || mobilePanel === 'ai'
  const shouldRenderDiagram = isDesktop || mobilePanel === 'diagram'

  useEffect(() => {
    if (!hasMountedMobilePanelEffectRef.current) {
      hasMountedMobilePanelEffectRef.current = true
      return
    }

    if (typeof window === 'undefined' || window.matchMedia('(min-width: 768px)').matches) {
      return
    }

    const target = document.getElementById(getMobilePanelSectionId(mobilePanel))
    if (!target) {
      return
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    target.scrollIntoView({
      block: 'start',
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    })
  }, [mobilePanel])

  useEffect(() => {
    if (shouldHydrateDiagram) {
      return
    }

    if (typeof window === 'undefined') {
      return
    }

    if (!('IntersectionObserver' in window)) {
      const timeoutId = setTimeout(() => setShouldHydrateDiagram(true), 0)
      return () => clearTimeout(timeoutId)
    }

    const section = diagramSectionRef.current
    if (!section) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShouldHydrateDiagram(true)
            observer.disconnect()
            break
          }
        }
      },
      { rootMargin: '240px 0px', threshold: 0.05 },
    )

    observer.observe(section)
    return () => observer.disconnect()
  }, [shouldHydrateDiagram])

  return (
    <div className="space-y-5 pb-[calc(env(safe-area-inset-bottom)+7rem)] md:pb-0">
      <div className="grid items-start gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="min-w-0">
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 sm:flex-nowrap">
              <div className="min-w-0">
                <CardTitle>Editor PSeInt</CardTitle>
                <CardDescription>Escribe o pega pseudocodigo y ejecutalo al instante.</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => applyProgramTemplate(defaultProgram, defaultInputs)}
              >
                Restaurar ejemplo
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <PseudocodeEditor value={source} onChange={handleSourceChange} onRunShortcut={() => void runProgram()} />

            <div className="hidden flex-wrap items-center gap-3 md:flex">
              <Button type="button" onClick={() => void runProgram()} disabled={isRunDisabled}>
                {runButtonText}
              </Button>
              <p className="text-xs text-muted-foreground">Atajo: Ctrl/Cmd + Enter para ejecutar.</p>
            </div>

            {parserError ? (
              <div className="space-y-2 rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2">
                <p className="text-sm text-amber-700">{parserError}</p>
                {parserHint ? <p className="text-xs text-amber-700/90">Sugerencia: {parserHint}</p> : null}
              </div>
            ) : null}

            {isAnalysisPending ? <p className="text-xs text-muted-foreground">Actualizando metricas y diagrama...</p> : null}

            <div className="md:hidden">
              <MobilePanelSelector
                active={mobilePanel}
                onChange={(panel) => {
                  setMobilePanel(panel)
                  if (panel === 'diagram') {
                    setShouldHydrateDiagram(true)
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

        <div className="min-w-0 space-y-5">
          <Card id={getMobilePanelSectionId('practice')} className={`min-w-0 ${panelClass('practice')}`}>
            <CardHeader>
              <CardTitle>Modo practica guiada</CardTitle>
              <CardDescription>Elige un ejercicio, intenta resolverlo y sigue tu progreso.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ejercicio</span>
                <select
                  className="h-11 w-full rounded-lg border border-border bg-card px-3 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
                  value={selectedExerciseId}
                  onChange={(event) => setSelectedExerciseId(event.target.value)}
                >
                  {practiceExercises.map((exercise) => (
                    <option key={exercise.id} value={exercise.id}>
                      [{exercise.level}] {exercise.title}
                    </option>
                  ))}
                </select>
              </label>

              {selectedExercise ? (
                <div className="space-y-3 rounded-lg border border-border bg-muted/25 p-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">Objetivo</p>
                    <p className="text-sm text-muted-foreground">{selectedExercise.objective}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">Pasos</p>
                    <ul className="space-y-1 text-sm text-foreground">
                      {selectedExercise.instructions.map((instruction) => (
                        <li key={instruction}>- {instruction}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">Intentos: {selectedProgress.attempts}</Badge>
                    <Badge variant={selectedProgress.completed ? 'secondary' : 'outline'}>
                      Estado: {selectedProgress.completed ? 'Completado' : 'Pendiente'}
                    </Badge>
                    <Badge variant="secondary">Nivel: {selectedExercise.level}</Badge>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Button type="button" variant="secondary" onClick={loadSelectedExercise}>
                      Cargar ejercicio
                    </Button>
                    <Button type="button" variant="outline" onClick={loadSelectedSolution}>
                      Ver solucion
                    </Button>
                    <Button type="button" variant="outline" onClick={() => markExerciseCompleted(selectedExercise.id)}>
                      Marcar completado
                    </Button>
                    <Button type="button" variant="ghost" onClick={resetPractice}>
                      Reset progreso
                    </Button>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card id={getMobilePanelSectionId('inputs')} className={`min-w-0 ${panelClass('inputs')}`}>
            <CardHeader>
              <CardTitle>Entradas</CardTitle>
              <CardDescription>Valores para las sentencias Leer.</CardDescription>
            </CardHeader>
            <CardContent>
              <RuntimeInputsForm
                fields={inputFields}
                values={inputs}
                onChange={(name, value) => {
                  setInputs((prev) => ({
                    ...prev,
                    [name]: value,
                  }))
                }}
              />
            </CardContent>
          </Card>

          <Card id={getMobilePanelSectionId('insights')} className={`min-w-0 ${panelClass('insights')}`}>
            <CardHeader>
              <CardTitle>Datos automaticos</CardTitle>
              <CardDescription>Metricas de complejidad, nivel y recomendaciones segun tu codigo.</CardDescription>
            </CardHeader>
            <CardContent>
              {insights && shouldRenderInsights ? (
                <Suspense fallback={<p className="text-sm text-muted-foreground">Calculando metricas...</p>}>
                  <ProgramInsightsPanel insights={insights} />
                </Suspense>
              ) : insights ? (
                <p className="text-sm text-muted-foreground">Selecciona este panel para ver metricas detalladas.</p>
              ) : parserError ? (
                <p className="text-sm text-muted-foreground">Corrige el parseo para calcular metricas automaticas.</p>
              ) : (
                <p className="text-sm text-muted-foreground">Escribe un algoritmo para generar metricas automaticas.</p>
              )}
            </CardContent>
          </Card>

          <Card id={getMobilePanelSectionId('ai')} className={`min-w-0 ${panelClass('ai')}`}>
            <CardHeader>
              <CardTitle>Tutor IA</CardTitle>
              <CardDescription>Feedback pedagogico contextual y accionable.</CardDescription>
            </CardHeader>
            <CardContent>
              {shouldRenderAi ? (
                <Suspense fallback={<p className="text-sm text-muted-foreground">Inicializando tutor...</p>}>
                  <AiTutorPanel source={source} parserError={parserError} insights={insights} />
                </Suspense>
              ) : (
                <p className="text-sm text-muted-foreground">Selecciona este panel para usar el tutor de IA.</p>
              )}
            </CardContent>
          </Card>

          <Card id={getMobilePanelSectionId('output')} className={`min-w-0 ${panelClass('output')}`}>
            <CardHeader>
              <CardTitle>Salida de ejecucion</CardTitle>
              <CardDescription>Consola y estado final de variables.</CardDescription>
            </CardHeader>
            <CardContent>
              <RuntimeOutputPanel execution={result?.execution ?? null} error={error} status={status} />
              {result?.execution ? (
                <p className="mt-3 text-xs text-muted-foreground">Pasos ejecutados: {result.execution.stepsExecuted}</p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      <div ref={diagramSectionRef}>
        <Card id={getMobilePanelSectionId('diagram')} className={`min-w-0 ${panelClass('diagram')}`}>
          <CardHeader>
            <CardTitle>Diagrama de flujo</CardTitle>
            <CardDescription>Se actualiza automaticamente al cambiar el codigo.</CardDescription>
          </CardHeader>
          <CardContent>
            {flowchartPreview && shouldRenderDiagram && shouldHydrateDiagram ? (
              <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando renderer de diagramas...</p>}>
                <MermaidChart chart={flowchartPreview} />
              </Suspense>
            ) : flowchartPreview && !shouldHydrateDiagram ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Carga el diagrama cuando lo necesites para mejorar rendimiento.</p>
                <Button type="button" variant="outline" onClick={() => setShouldHydrateDiagram(true)}>
                  Ver diagrama
                </Button>
              </div>
            ) : flowchartPreview ? (
              <p className="text-sm text-muted-foreground">Selecciona este panel para visualizar el diagrama.</p>
            ) : parserError ? (
              <p className="text-sm text-muted-foreground">Corrige el codigo para generar el diagrama.</p>
            ) : (
              <p className="text-sm text-muted-foreground">Escribe un algoritmo para construir el diagrama de flujo.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <MobileRunDock
        onRun={runProgram}
        disabled={isRunDisabled}
        statusText={runButtonText}
        hasParserError={Boolean(parserError)}
      />
    </div>
  )
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false))

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const mediaQuery = window.matchMedia(query)
    const legacyMediaQuery = mediaQuery as MediaQueryList & {
      addListener?: (listener: (event: MediaQueryListEvent) => void) => void
      removeListener?: (listener: (event: MediaQueryListEvent) => void) => void
    }
    const handleChange = () => setMatches(mediaQuery.matches)
    handleChange()
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange)
    } else if (typeof legacyMediaQuery.addListener === 'function') {
      legacyMediaQuery.addListener(handleChange)
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', handleChange)
      } else if (typeof legacyMediaQuery.removeListener === 'function') {
        legacyMediaQuery.removeListener(handleChange)
      }
    }
  }, [query])

  return matches
}

function MobileRunDock({
  onRun,
  disabled,
  statusText,
  hasParserError,
}: {
  onRun: () => Promise<void>
  disabled: boolean
  statusText: string
  hasParserError: boolean
}) {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const viewport = window.visualViewport
    if (!viewport) {
      return
    }

    const updateKeyboardState = () => {
      const active = document.activeElement
      const isTypingTarget = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || active instanceof HTMLSelectElement
      const viewportDelta = window.innerHeight - viewport.height
      const keyboardLikelyVisible = viewportDelta > MOBILE_KEYBOARD_DELTA_THRESHOLD
      setIsKeyboardOpen(isTypingTarget && keyboardLikelyVisible)
    }

    updateKeyboardState()
    viewport.addEventListener('resize', updateKeyboardState)
    viewport.addEventListener('scroll', updateKeyboardState)
    window.addEventListener('focusin', updateKeyboardState)
    window.addEventListener('focusout', updateKeyboardState)

    return () => {
      viewport.removeEventListener('resize', updateKeyboardState)
      viewport.removeEventListener('scroll', updateKeyboardState)
      window.removeEventListener('focusin', updateKeyboardState)
      window.removeEventListener('focusout', updateKeyboardState)
    }
  }, [])

  if (isKeyboardOpen) {
    return null
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 sm:px-4 md:hidden">
      <p className="mb-2 text-center text-[11px] text-muted-foreground">
        {hasParserError ? 'Corrige el error de parseo para ejecutar.' : 'Accion principal en zona ergonomica (pulgar).'}
      </p>
      <Button type="button" className="w-full" onClick={() => void onRun()} disabled={disabled}>
        {statusText}
      </Button>
    </div>
  )
}

function MobilePanelSelector({
  active,
  onChange,
}: {
  active: MobilePanelKey
  onChange: (panel: MobilePanelKey) => void
}) {
  const selectorId = 'mobile-panel-selector'

  return (
    <label className="block space-y-1.5" htmlFor={selectorId}>
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Panel visible</span>
      <select
        id={selectorId}
        className="h-11 w-full rounded-lg border border-border bg-card px-3 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        value={active}
        onChange={(event) => onChange(event.target.value as MobilePanelKey)}
      >
        {mobilePanels.map((panel) => (
          <option key={panel.key} value={panel.key}>
            {panel.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function keepOnlyExpectedInputs(
  currentInputs: Record<string, string>,
  fields: RuntimeInputField[],
): Record<string, string> {
  const nextEntries = fields.map((field) => [field.name, currentInputs[field.name] ?? defaultInputs[field.name] ?? ''] as const)
  return Object.fromEntries(nextEntries)
}

function isExpectedOutputMatch(runtimeOutput: string[], expectedOutput: string[]): boolean {
  if (runtimeOutput.length !== expectedOutput.length) {
    return false
  }

  for (let index = 0; index < runtimeOutput.length; index += 1) {
    if (runtimeOutput[index]?.trim() !== expectedOutput[index]?.trim()) {
      return false
    }
  }

  return true
}
