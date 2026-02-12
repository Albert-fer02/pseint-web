import { lazy, Suspense, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { PseudocodeEditor } from '@/features/editor/ui/PseudocodeEditor'
import { usePseintRuntime } from '@/features/runtime/hooks/usePseintRuntime'
import { examplePrograms } from '@/features/runtime/model/examplePrograms'
import { usePlaygroundWorkspace } from '@/pages/playground/hooks/usePlaygroundWorkspace'
import { usePracticeMode } from '@/pages/playground/hooks/usePracticeMode'
import { useMediaQuery } from '@/pages/playground/hooks/useMediaQuery'
import {
  getMobilePanelSectionId,
  quickSnippets,
  type MobilePanelKey,
} from '@/pages/playground/model/playgroundUiConfig'
import {
  practiceUnits,
} from '@/features/runtime/model/practiceExercises'
import {
  extractParserErrorLine,
  isExpectedOutputMatch,
} from '@/pages/playground/lib/playgroundRuntimeUtils'
import { FlowchartCard } from '@/pages/playground/ui/components/FlowchartCard'
import { FlowchartExpandedModal } from '@/pages/playground/ui/components/FlowchartExpandedModal'
import { MobilePanelSelector } from '@/pages/playground/ui/components/MobilePanelSelector'
import { MobileRunDock } from '@/pages/playground/ui/components/MobileRunDock'
import { extractInputFields } from '@/shared/lib/pseint/analyzer'
import { getPseintErrorHint } from '@/shared/lib/pseint/errorHints'
import { buildFlowchart } from '@/shared/lib/pseint/flowchart'
import { analyzeProgram } from '@/shared/lib/pseint/insights'
import { parseProgram } from '@/shared/lib/pseint/parser'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'

const ProgramInsightsPanel = lazy(() =>
  import('@/features/analysis/ui/ProgramInsightsPanel').then((module) => ({ default: module.ProgramInsightsPanel })),
)
const AiTutorPanel = lazy(() => import('@/features/ai/ui/AiTutorPanel').then((module) => ({ default: module.AiTutorPanel })))
const LearningPathPanel = lazy(() =>
  import('@/features/runtime/ui/LearningPathPanel').then((module) => ({ default: module.LearningPathPanel })),
)
const PracticeGuidedCard = lazy(() =>
  import('@/pages/playground/ui/components/PracticeGuidedCard').then((module) => ({ default: module.PracticeGuidedCard })),
)
const RuntimeInputsForm = lazy(() =>
  import('@/features/runtime/ui/RuntimeInputsForm').then((module) => ({ default: module.RuntimeInputsForm })),
)
const RuntimeOutputPanel = lazy(() =>
  import('@/features/runtime/ui/RuntimeOutputPanel').then((module) => ({ default: module.RuntimeOutputPanel })),
)

export function PlaygroundPage() {
  const [mobilePanel, setMobilePanel] = useState<MobilePanelKey>('inputs')
  const hasMountedMobilePanelEffectRef = useRef(false)
  const diagramSectionRef = useRef<HTMLDivElement | null>(null)
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const [shouldHydrateDiagram, setShouldHydrateDiagram] = useState(false)
  const [isDiagramExpanded, setIsDiagramExpanded] = useState(false)

  const { run, reset, status, result, error } = usePseintRuntime()
  const {
    projects,
    activeProjectId,
    source,
    inputs,
    selectedExampleId,
    setSelectedExampleId,
    setInputs,
    switchProject,
    createProject,
    renameProject,
    deleteProject,
    loadSelectedExample,
    formatCurrentSource,
    appendSnippetAtEnd,
    handleSourceChange,
    restoreDefaultProgram,
    applyProgramTemplate,
  } = usePlaygroundWorkspace({ onRuntimeReset: reset })
  const deferredSource = useDeferredValue(source)
  const {
    selectedUnitId,
    exercisesByUnit,
    selectedUnit,
    selectedExercise,
    selectedProgress,
    selectedExerciseAccess,
    setSelectedExerciseId,
    handleUnitChange,
    markExerciseAttempt,
    markExerciseCreationFromSource,
    markExerciseCompleted,
    markExerciseStageCompleted,
    saveExerciseReflection,
    loadSelectedExercise,
    loadSelectedSolution,
    resetPractice,
    mastery,
    stageFlow,
  } = usePracticeMode({ applyProgramTemplate })

  const loadSelectedExampleAndShowInputs = () => {
    loadSelectedExample()
    setMobilePanel('inputs')
  }

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
  const parserErrorLine = useMemo(() => extractParserErrorLine(parserError), [parserError])

  const runProgram = async () => {
    if (parserError) {
      return
    }

    if (selectedExercise && selectedExerciseAccess.unlocked) {
      markExerciseAttempt(selectedExercise.id)
      markExerciseCreationFromSource(selectedExercise.id, source)
    }

    try {
      const runtimeResult = await run(source, inputs)
      if (selectedExercise && selectedExerciseAccess.unlocked) {
        markExerciseStageCompleted(selectedExercise.id, 'ejecuta')
      }
      if (
        selectedExercise &&
        selectedExerciseAccess.unlocked &&
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

  useEffect(() => {
    if (!isDiagramExpanded || typeof document === 'undefined') {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isDiagramExpanded])

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
                onClick={restoreDefaultProgram}
              >
                Restaurar ejemplo
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid gap-3 lg:grid-cols-2">
              <div className="space-y-2">
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Proyecto activo</span>
                  <select
                    className="h-11 w-full rounded-lg border border-border bg-card px-3 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
                    value={activeProjectId}
                    onChange={(event) => switchProject(event.target.value)}
                  >
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <Button type="button" variant="outline" onClick={createProject}>
                    Nuevo
                  </Button>
                  <Button type="button" variant="outline" onClick={renameProject}>
                    Renombrar
                  </Button>
                  <Button type="button" variant="outline" onClick={deleteProject} disabled={projects.length <= 1}>
                    Eliminar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Guardado automatico activo (localStorage).</p>
              </div>

              <div className="space-y-2">
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cargar ejemplo</span>
                  <select
                    className="h-11 w-full rounded-lg border border-border bg-card px-3 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
                    value={selectedExampleId}
                    onChange={(event) => setSelectedExampleId(event.target.value)}
                  >
                    {examplePrograms.map((example) => (
                      <option key={example.id} value={example.id}>
                        [{example.level}] {example.title}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Button type="button" variant="secondary" onClick={loadSelectedExampleAndShowInputs}>
                    Cargar ejemplo
                  </Button>
                  <Button type="button" variant="outline" onClick={formatCurrentSource}>
                    Formatear codigo
                  </Button>
                </div>
              </div>
            </div>

            <PseudocodeEditor
              value={source}
              onChange={handleSourceChange}
              onRunShortcut={() => void runProgram()}
              parserErrorLine={parserErrorLine}
              parserErrorMessage={parserError}
            />

            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Snippets rapidos</p>
              <div className="-mx-1 overflow-x-auto px-1">
                <div className="flex min-w-max items-center gap-2">
                  {quickSnippets.map((snippet) => (
                    <Button key={snippet.id} type="button" variant="outline" size="sm" onClick={() => appendSnippetAtEnd(snippet.content)}>
                      {snippet.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

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
          <Card className="min-w-0">
            <CardHeader>
            <CardTitle>Ruta integral de aprendizaje</CardTitle>
              <CardDescription>Progreso por unidad y cobertura de temas del curso.</CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<p className="text-sm text-muted-foreground">Calculando ruta...</p>}>
                <LearningPathPanel units={practiceUnits} mastery={mastery} />
              </Suspense>
            </CardContent>
          </Card>

          <Suspense fallback={<Card className={`min-w-0 ${panelClass('practice')}`}><CardContent className="py-6 text-sm text-muted-foreground">Cargando practica guiada...</CardContent></Card>}>
            <PracticeGuidedCard
              key={selectedExercise?.id ?? selectedUnitId}
              cardId={getMobilePanelSectionId('practice')}
              cardClassName={`min-w-0 ${panelClass('practice')}`}
              selectedUnitId={selectedUnitId}
              selectedExercise={selectedExercise}
              exercisesByUnit={exercisesByUnit}
              selectedUnitTitle={selectedUnit?.title ?? 'Sin unidad'}
              selectedProgress={selectedProgress}
              selectedExerciseAccess={selectedExerciseAccess}
              stageFlow={stageFlow}
              exerciseAccessById={mastery.exerciseAccessById}
              unlockedUnitIds={mastery.unlockedUnitIds}
              onUnitChange={handleUnitChange}
            onExerciseChange={setSelectedExerciseId}
            onLoadExercise={loadSelectedExercise}
            onLoadSolution={loadSelectedSolution}
            onMarkLearned={() => {
              if (selectedExercise) {
                markExerciseStageCompleted(selectedExercise.id, 'aprende')
              }
            }}
            onSaveReflection={(note) => {
                if (selectedExercise) {
                  saveExerciseReflection(selectedExercise.id, note)
                }
              }}
              onResetProgress={resetPractice}
            />
          </Suspense>

          <Card id={getMobilePanelSectionId('inputs')} className={`min-w-0 ${panelClass('inputs')}`}>
            <CardHeader>
              <CardTitle>Entradas</CardTitle>
              <CardDescription>Valores para las sentencias Leer.</CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando formulario...</p>}>
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
              </Suspense>
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
              <Suspense fallback={<p className="text-sm text-muted-foreground">Preparando salida...</p>}>
                <RuntimeOutputPanel execution={result?.execution ?? null} error={error} status={status} />
              </Suspense>
              {result?.execution ? (
                <p className="mt-3 text-xs text-muted-foreground">Pasos ejecutados: {result.execution.stepsExecuted}</p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      <div ref={diagramSectionRef}>
        <FlowchartCard
          cardId={getMobilePanelSectionId('diagram')}
          cardClassName={`min-w-0 ${panelClass('diagram')}`}
          flowchartPreview={flowchartPreview}
          parserError={parserError}
          shouldRenderDiagram={shouldRenderDiagram}
          shouldHydrateDiagram={shouldHydrateDiagram}
          onEnableHydration={() => setShouldHydrateDiagram(true)}
          onExpand={() => {
            setShouldHydrateDiagram(true)
            setIsDiagramExpanded(true)
          }}
        />
      </div>

      <FlowchartExpandedModal
        open={isDiagramExpanded}
        flowchartPreview={flowchartPreview}
        onClose={() => setIsDiagramExpanded(false)}
      />

      <MobileRunDock
        onRun={runProgram}
        disabled={isRunDisabled}
        statusText={runButtonText}
        hasParserError={Boolean(parserError)}
      />
    </div>
  )
}
