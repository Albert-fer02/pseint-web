import { lazy, Suspense } from 'react'
import type { ProgramInsights, RuntimeExecution, RuntimeInputField } from '@/entities/pseint/model/types'
import {
  practiceUnits,
  type PracticeExercise,
  type PracticeExerciseAccess,
  type PracticeMasterySnapshot,
  type PracticeProgressEntry,
  type PracticeStageDefinition,
  type PracticeUnitId,
} from '@/features/runtime/model/practiceExercises'
import { getMobilePanelSectionId, type MobilePanelKey } from '@/pages/playground/model/playgroundUiConfig'
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

interface PlaygroundLearningColumnProps {
  panelClass: (panel: MobilePanelKey) => string
  getMobileTabId: (panel: MobilePanelKey) => string
  selectedUnitId: PracticeUnitId
  selectedUnitTitle: string
  selectedExercise: PracticeExercise | null
  exercisesByUnit: PracticeExercise[]
  selectedProgress: PracticeProgressEntry
  selectedExerciseAccess: PracticeExerciseAccess
  stageFlow: PracticeStageDefinition[]
  mastery: PracticeMasterySnapshot
  onUnitChange: (unitId: PracticeUnitId) => void
  onExerciseChange: (exerciseId: string) => void
  onLoadExercise: () => void
  onLoadSolution: () => void
  onMarkLearned: () => void
  onSaveReflection: (note: string) => void
  onResetProgress: () => void
  inputFields: RuntimeInputField[]
  inputs: Record<string, string>
  onInputChange: (name: string, value: string) => void
  insights: ProgramInsights | null
  parserError: string | null
  source: string
  shouldRenderInsights: boolean
  shouldRenderAi: boolean
  status: 'idle' | 'running' | 'success' | 'error'
  execution: RuntimeExecution | null
  runtimeError: string | null
}

export function PlaygroundLearningColumn({
  panelClass,
  getMobileTabId,
  selectedUnitId,
  selectedUnitTitle,
  selectedExercise,
  exercisesByUnit,
  selectedProgress,
  selectedExerciseAccess,
  stageFlow,
  mastery,
  onUnitChange,
  onExerciseChange,
  onLoadExercise,
  onLoadSolution,
  onMarkLearned,
  onSaveReflection,
  onResetProgress,
  inputFields,
  inputs,
  onInputChange,
  insights,
  parserError,
  source,
  shouldRenderInsights,
  shouldRenderAi,
  status,
  execution,
  runtimeError,
}: PlaygroundLearningColumnProps) {
  return (
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

      <Suspense
        fallback={(
          <Card className={`min-w-0 ${panelClass('practice')}`}>
            <CardContent className="py-6 text-sm text-muted-foreground">Cargando practica guiada...</CardContent>
          </Card>
        )}
      >
        <PracticeGuidedCard
          key={selectedExercise?.id ?? selectedUnitId}
          cardId={getMobilePanelSectionId('practice')}
          cardClassName={`min-w-0 ${panelClass('practice')}`}
          ariaLabelledBy={getMobileTabId('practice')}
          selectedUnitId={selectedUnitId}
          selectedExercise={selectedExercise}
          exercisesByUnit={exercisesByUnit}
          selectedUnitTitle={selectedUnitTitle}
          selectedProgress={selectedProgress}
          selectedExerciseAccess={selectedExerciseAccess}
          stageFlow={stageFlow}
          exerciseAccessById={mastery.exerciseAccessById}
          unlockedUnitIds={mastery.unlockedUnitIds}
          onUnitChange={onUnitChange}
          onExerciseChange={onExerciseChange}
          onLoadExercise={onLoadExercise}
          onLoadSolution={onLoadSolution}
          onMarkLearned={onMarkLearned}
          onSaveReflection={onSaveReflection}
          onResetProgress={onResetProgress}
        />
      </Suspense>

      <Card
        id={getMobilePanelSectionId('inputs')}
        className={`min-w-0 ${panelClass('inputs')}`}
        role="tabpanel"
        aria-labelledby={getMobileTabId('inputs')}
      >
        <CardHeader>
          <CardTitle>Entradas</CardTitle>
          <CardDescription>Valores para las sentencias Leer.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando formulario...</p>}>
            <RuntimeInputsForm fields={inputFields} values={inputs} onChange={onInputChange} />
          </Suspense>
        </CardContent>
      </Card>

      <Card
        id={getMobilePanelSectionId('insights')}
        className={`min-w-0 ${panelClass('insights')}`}
        role="tabpanel"
        aria-labelledby={getMobileTabId('insights')}
      >
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

      <Card
        id={getMobilePanelSectionId('ai')}
        className={`min-w-0 ${panelClass('ai')}`}
        role="tabpanel"
        aria-labelledby={getMobileTabId('ai')}
      >
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

      <Card
        id={getMobilePanelSectionId('output')}
        className={`min-w-0 ${panelClass('output')}`}
        role="tabpanel"
        aria-labelledby={getMobileTabId('output')}
      >
        <CardHeader>
          <CardTitle>Salida de ejecucion</CardTitle>
          <CardDescription>Consola y estado final de variables.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<p className="text-sm text-muted-foreground">Preparando salida...</p>}>
            <RuntimeOutputPanel execution={execution} error={runtimeError} status={status} />
          </Suspense>
          {execution ? <p className="mt-3 text-xs text-muted-foreground">Pasos ejecutados: {execution.stepsExecuted}</p> : null}
        </CardContent>
      </Card>
    </div>
  )
}
