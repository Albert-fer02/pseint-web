import { useState } from 'react'
import { usePseintRuntime } from '@/features/runtime/hooks/usePseintRuntime'
import { useFlowchartDiagramState } from '@/pages/playground/hooks/useFlowchartDiagramState'
import { useMediaQuery } from '@/pages/playground/hooks/useMediaQuery'
import { useMobilePanelAutoScroll } from '@/pages/playground/hooks/useMobilePanelAutoScroll'
import { usePlaygroundAnalysis } from '@/pages/playground/hooks/usePlaygroundAnalysis'
import { usePlaygroundWorkspace } from '@/pages/playground/hooks/usePlaygroundWorkspace'
import { usePracticeMode } from '@/pages/playground/hooks/usePracticeMode'
import { isExpectedOutputMatch } from '@/pages/playground/lib/playgroundRuntimeUtils'
import {
  getMobilePanelSectionId,
  getMobilePanelTabId,
  type MobilePanelKey,
} from '@/pages/playground/model/playgroundUiConfig'
import { FlowchartCard } from '@/pages/playground/ui/components/FlowchartCard'
import { FlowchartExpandedModal } from '@/pages/playground/ui/components/FlowchartExpandedModal'
import { LearningFocusBanner } from '@/pages/playground/ui/components/LearningFocusBanner'
import { MobileRunDock } from '@/pages/playground/ui/components/MobileRunDock'
import { PlaygroundEditorCard } from '@/pages/playground/ui/components/PlaygroundEditorCard'
import { PlaygroundLearningColumn } from '@/pages/playground/ui/components/PlaygroundLearningColumn'

export function PlaygroundPage() {
  const [mobilePanel, setMobilePanel] = useState<MobilePanelKey>('inputs')
  const isDesktop = useMediaQuery('(min-width: 768px)')

  useMobilePanelAutoScroll(mobilePanel)

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
      setMobilePanel('output')
    } catch {
      setMobilePanel('output')
    }
  }

  const loadSelectedExampleAndShowInputs = () => {
    loadSelectedExample()
    setMobilePanel('inputs')
  }

  const goToPractice = () => {
    setMobilePanel('practice')
    if (typeof document === 'undefined') {
      return
    }

    const target = document.getElementById(getMobilePanelSectionId('practice'))
    if (!target) {
      return
    }

    target.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }

  const runButtonText = status === 'running' ? 'Ejecutando...' : 'Ejecutar programa'
  const isRunDisabled = status === 'running' || Boolean(parserError)
  const panelClass = (panel: MobilePanelKey) => (mobilePanel === panel ? 'block' : 'hidden md:block')
  const shouldRenderInsights = isDesktop || mobilePanel === 'insights'
  const shouldRenderAi = isDesktop || mobilePanel === 'ai'
  const shouldRenderDiagram = isDesktop || mobilePanel === 'diagram'

  return (
    <div className="space-y-5 pb-[calc(env(safe-area-inset-bottom)+7rem)] md:pb-0">
      <LearningFocusBanner
        selectedExercise={selectedExercise}
        selectedProgress={selectedProgress}
        parserError={parserError}
        onGoToPractice={goToPractice}
      />

      <div className="grid items-start gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <PlaygroundEditorCard
          projects={projects}
          activeProjectId={activeProjectId}
          selectedExampleId={selectedExampleId}
          source={source}
          parserErrorLine={parserErrorLine}
          parserError={parserError}
          parserHint={parserHint}
          isAnalysisPending={isAnalysisPending}
          mobilePanel={mobilePanel}
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
          onMobilePanelChange={(panel) => {
            setMobilePanel(panel)
            if (panel === 'diagram') {
              enableDiagramHydration()
            }
          }}
        />

        <PlaygroundLearningColumn
          panelClass={panelClass}
          getMobileTabId={getMobilePanelTabId}
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
          status={status}
          execution={result?.execution ?? null}
          runtimeError={error}
        />
      </div>

      <div ref={diagramSectionRef}>
        <FlowchartCard
          cardId={getMobilePanelSectionId('diagram')}
          cardClassName={`min-w-0 ${panelClass('diagram')}`}
          ariaLabelledBy={getMobilePanelTabId('diagram')}
          flowchartPreview={flowchartPreview}
          parserError={parserError}
          shouldRenderDiagram={shouldRenderDiagram}
          shouldHydrateDiagram={shouldHydrateDiagram}
          onEnableHydration={enableDiagramHydration}
          onExpand={openDiagram}
        />
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
