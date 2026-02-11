import { lazy, Suspense, useMemo, useState } from 'react'
import type { RuntimeInputField } from '@/entities/pseint/model/types'
import { ProgramInsightsPanel } from '@/features/analysis/ui/ProgramInsightsPanel'
import { AiTutorPanel } from '@/features/ai/ui/AiTutorPanel'
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

const MermaidChart = lazy(() => import('@/shared/lib/mermaid/MermaidChart'))

const initialExerciseId = practiceExercises[0]?.id ?? ''

export function PlaygroundPage() {
  const [source, setSource] = useState(defaultProgram)
  const [inputs, setInputs] = useState<Record<string, string>>(defaultInputs)
  const [selectedExerciseId, setSelectedExerciseId] = useState(initialExerciseId)
  const [practiceProgress, setPracticeProgress] = useState<PracticeProgress>(() => loadPracticeProgress())

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
      const ast = parseProgram(source)
      return {
        inputFields: extractInputFields(ast),
        parserError: null,
        flowchartPreview: buildFlowchart(ast),
        insights: analyzeProgram(source, ast),
      }
    } catch (parseError) {
      return {
        inputFields: [],
        parserError: parseError instanceof Error ? parseError.message : 'Error de parseo.',
        flowchartPreview: null,
        insights: null,
      }
    }
  }, [source])

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
    } catch {
      // runtime errors are already reflected in hook state
    }
  }

  const runButtonText = status === 'running' ? 'Ejecutando...' : 'Ejecutar programa'
  const isRunDisabled = status === 'running' || Boolean(parserError)

  return (
    <div className="space-y-5 pb-[calc(env(safe-area-inset-bottom)+6.5rem)] md:pb-0">
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Editor PSeInt</CardTitle>
                <CardDescription>Escribe o pega pseudocodigo. La ejecucion corre en Web Worker.</CardDescription>
              </div>
              <Button type="button" variant="outline" onClick={() => applyProgramTemplate(defaultProgram, defaultInputs)}>
                Restaurar ejemplo
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">React + Bun</Badge>
              <Badge variant="secondary">Worker Runtime</Badge>
              <Badge variant="secondary">Mermaid</Badge>
              <Badge variant="secondary">Insights en vivo</Badge>
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
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Modo practica guiada</CardTitle>
              <CardDescription>Elige un ejercicio, intenta resolverlo y sigue tu progreso.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ejercicio</span>
                <select
                  className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

          <Card>
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

          <Card>
            <CardHeader>
              <CardTitle>Datos automaticos</CardTitle>
              <CardDescription>Metricas de complejidad, nivel y recomendaciones segun tu codigo.</CardDescription>
            </CardHeader>
            <CardContent>
              {insights ? (
                <ProgramInsightsPanel insights={insights} />
              ) : (
                <p className="text-sm text-muted-foreground">Corrige el parseo para calcular metricas automaticas.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tutor IA</CardTitle>
              <CardDescription>Feedback pedagogico contextual y accionable.</CardDescription>
            </CardHeader>
            <CardContent>
              <AiTutorPanel source={source} parserError={parserError} insights={insights} />
            </CardContent>
          </Card>

          <Card>
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

      <Card>
        <CardHeader>
          <CardTitle>Diagrama de flujo</CardTitle>
          <CardDescription>Se actualiza automaticamente al cambiar el codigo.</CardDescription>
        </CardHeader>
        <CardContent>
          {flowchartPreview ? (
            <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando renderer de diagramas...</p>}>
              <MermaidChart chart={flowchartPreview} />
            </Suspense>
          ) : (
            <p className="text-sm text-muted-foreground">Corrige el codigo para generar el diagrama.</p>
          )}
        </CardContent>
      </Card>

      <MobileRunDock
        onRun={runProgram}
        disabled={isRunDisabled}
        statusText={runButtonText}
        hasParserError={Boolean(parserError)}
      />
    </div>
  )
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
  return (
    <div className="surface-scrim fixed inset-x-0 bottom-0 z-20 border-t border-border px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur sm:px-4 md:hidden">
      <p className="mb-2 text-center text-[11px] text-muted-foreground">
        {hasParserError ? 'Corrige el error de parseo para ejecutar.' : 'Accion principal en zona ergonomica (pulgar).'}
      </p>
      <Button type="button" className="w-full" onClick={() => void onRun()} disabled={disabled}>
        {statusText}
      </Button>
    </div>
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
