import { lazy, Suspense, useState } from 'react'
import { usePseintRuntime } from '@/features/runtime/hooks/usePseintRuntime'
import { useFlowchartDiagramState } from '@/pages/playground/hooks/useFlowchartDiagramState'
import { useMediaQuery } from '@/pages/playground/hooks/useMediaQuery'
import { useMobilePanelAutoScroll } from '@/pages/playground/hooks/useMobilePanelAutoScroll'
import { usePlaygroundAnalysis } from '@/pages/playground/hooks/usePlaygroundAnalysis'
import { usePlaygroundWorkspace } from '@/pages/playground/hooks/usePlaygroundWorkspace'
import { usePracticeMode } from '@/pages/playground/hooks/usePracticeMode'
import { isExpectedOutputMatch } from '@/pages/playground/lib/playgroundRuntimeUtils'
import { getMobilePanelSectionId, type MobilePanelKey } from '@/pages/playground/model/playgroundUiConfig'
import { FlowchartExpandedModal } from '@/pages/playground/ui/components/FlowchartExpandedModal'
import { LearningFocusBanner } from '@/pages/playground/ui/components/LearningFocusBanner'
import { MobileRunDock } from '@/pages/playground/ui/components/MobileRunDock'
import { Card, CardContent } from '@/shared/ui/card'

const PlaygroundEditorCard = lazy(() =>
  import('@/pages/playground/ui/components/PlaygroundEditorCard').then((module) => ({ default: module.PlaygroundEditorCard })),
)
const PlaygroundLearningColumn = lazy(() =>
  import('@/pages/playground/ui/components/PlaygroundLearningColumn').then((module) => ({ default: module.PlaygroundLearningColumn })),
)

export function PlaygroundPage() {
  const [activePanel, setActivePanel] = useState<MobilePanelKey>('practice')
  const isDesktop = useMediaQuery('(min-width: 768px)')

  useMobilePanelAutoScroll(activePanel)

  const {
    diagramSectionRef,
    shouldHydrateDiagram,
    isDiagramExpanded,
    enableDiagramHydration,
    openDiagram,
    closeDiagram,
  } = useFlowchartDiagramState()

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

  const {
    inputFields,
    parserError,
    parserHint,
    parserErrorLine,
    flowchartPreview,
    insights,
    isAnalysisPending,
  } = usePlaygroundAnalysis(source)

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
        selectedExercise
        && selectedExerciseAccess.unlocked
        && selectedExercise.expectedOutputLines
        && isExpectedOutputMatch(runtimeResult.execution.outputs, selectedExercise.expectedOutputLines)
      ) {
        markExerciseCompleted(selectedExercise.id)
      }
      setActivePanel('output')
    } catch {
      setActivePanel('output')
    }
  }

  const loadSelectedExampleAndShowInputs = () => {
    loadSelectedExample()
    setActivePanel('inputs')
  }

  const goToPractice = () => {
    setActivePanel('practice')
    if (typeof document === 'undefined') {
      return
    }

    const target = document.getElementById(getMobilePanelSectionId('practice'))
    if (!target) {
      return
    }

    target.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }

  const handlePanelChange = (panel: MobilePanelKey) => {
    setActivePanel(panel)
    if (panel === 'diagram') {
      enableDiagramHydration()
    }
  }

  const runButtonText = status === 'running' ? 'Ejecutando...' : 'Ejecutar programa'
  const isRunDisabled = status === 'running' || Boolean(parserError)
  const shouldRenderInsights = isDesktop || activePanel === 'insights'
  const shouldRenderAi = isDesktop || activePanel === 'ai'
  const shouldRenderDiagram = isDesktop || activePanel === 'diagram'

  return (
    <div className="space-y-4 pb-[calc(env(safe-area-inset-bottom)+7rem)] md:pb-0">
      <LearningFocusBanner
        selectedExercise={selectedExercise}
        selectedProgress={selectedProgress}
        parserError={parserError}
        onGoToPractice={goToPractice}
      />

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <Suspense fallback={<Card><CardContent className="py-6 text-sm text-muted-foreground">Cargando editor...</CardContent></Card>}>
            <PlaygroundEditorCard
              projects={projects}
              activeProjectId={activeProjectId}
              selectedExampleId={selectedExampleId}
              source={source}
              parserErrorLine={parserErrorLine}
              parserError={parserError}
              parserHint={parserHint}
              isAnalysisPending={isAnalysisPending}
              runButtonText={runButtonText}
              isRunDisabled={isRunDisabled}
              onSwitchProject={switchProject}
              onCreateProject={createProject}
              onRenameProject={renameProject}
              onDeleteProject={deleteProject}
              onSelectedExampleChange={setSelectedExampleId}
              onLoadSelectedExample={loadSelectedExampleAndShowInputs}
              onFormatSource={formatCurrentSource}
              onSourceChange={handleSourceChange}
              onAppendSnippet={appendSnippetAtEnd}
              onRunProgram={() => void runProgram()}
              onRestoreDefault={restoreDefaultProgram}
            />
          </Suspense>
        </div>

        <Suspense fallback={<Card><CardContent className="py-6 text-sm text-muted-foreground">Cargando paneles...</CardContent></Card>}>
          <PlaygroundLearningColumn
            activePanel={activePanel}
            onPanelChange={handlePanelChange}
            isDesktop={isDesktop}
            selectedUnitId={selectedUnitId}
            selectedUnitTitle={selectedUnit?.title ?? 'Sin unidad'}
            selectedExercise={selectedExercise}
            exercisesByUnit={exercisesByUnit}
            selectedProgress={selectedProgress}
            selectedExerciseAccess={selectedExerciseAccess}
            stageFlow={stageFlow}
            mastery={mastery}
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
            inputFields={inputFields}
            inputs={inputs}
            onInputChange={(name, value) => {
              setInputs((prev) => ({
                ...prev,
                [name]: value,
              }))
            }}
            insights={insights}
            parserError={parserError}
            source={source}
            shouldRenderInsights={shouldRenderInsights}
            shouldRenderAi={shouldRenderAi}
            shouldRenderDiagram={shouldRenderDiagram}
            status={status}
            execution={result?.execution ?? null}
            runtimeError={error}
            flowchartPreview={flowchartPreview}
            shouldHydrateDiagram={shouldHydrateDiagram}
            onEnableDiagramHydration={enableDiagramHydration}
            onExpandDiagram={openDiagram}
            diagramSectionRef={diagramSectionRef}
          />
        </Suspense>
      </div>

      <FlowchartExpandedModal
        open={isDiagramExpanded}
        flowchartPreview={flowchartPreview}
        onClose={closeDiagram}
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
