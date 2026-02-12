import { useMemo, useState } from 'react'
import {
  buildPracticeCheckpoint,
  getNextPendingStageId,
  REFLECTION_MIN_LENGTH,
  type PracticeExercise,
  type PracticeExerciseAccess,
  type PracticeProgressEntry,
  type PracticeStageDefinition,
  type PracticeUnitId,
} from '@/features/runtime/model/practiceExercises'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { PracticeActiveStageSection } from '@/pages/playground/ui/components/practice-guided/PracticeActiveStageSection'
import { PracticeGuidedSelectors } from '@/pages/playground/ui/components/practice-guided/PracticeGuidedSelectors'
import { PracticeMissionSummary } from '@/pages/playground/ui/components/practice-guided/PracticeMissionSummary'
import { PracticeStageRail } from '@/pages/playground/ui/components/PracticeStageRail'

interface PracticeGuidedCardProps {
  cardId: string
  cardClassName: string
  ariaLabelledBy?: string
  selectedUnitId: PracticeUnitId
  selectedExercise: PracticeExercise | null
  exercisesByUnit: PracticeExercise[]
  selectedUnitTitle: string
  selectedProgress: PracticeProgressEntry
  selectedExerciseAccess: PracticeExerciseAccess
  stageFlow: PracticeStageDefinition[]
  exerciseAccessById: Record<string, PracticeExerciseAccess>
  unlockedUnitIds: PracticeUnitId[]
  onUnitChange: (unitId: PracticeUnitId) => void
  onExerciseChange: (exerciseId: string) => void
  onLoadExercise: () => void
  onLoadSolution: () => void
  onMarkLearned: () => void
  onSaveReflection: (note: string) => void
  onResetProgress: () => void
}

export function PracticeGuidedCard({
  cardId,
  cardClassName,
  ariaLabelledBy,
  selectedUnitId,
  selectedExercise,
  exercisesByUnit,
  selectedUnitTitle,
  selectedProgress,
  selectedExerciseAccess,
  stageFlow,
  exerciseAccessById,
  unlockedUnitIds,
  onUnitChange,
  onExerciseChange,
  onLoadExercise,
  onLoadSolution,
  onMarkLearned,
  onSaveReflection,
  onResetProgress,
}: PracticeGuidedCardProps) {
  const [reflectionDraft, setReflectionDraft] = useState(() => selectedProgress.reflectionNote ?? '')
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null)
  const [checkpointFeedback, setCheckpointFeedback] = useState<string | null>(null)

  const checkpoint = useMemo(() => (selectedExercise ? buildPracticeCheckpoint(selectedExercise) : null), [selectedExercise])
  const nextStageId = useMemo(() => getNextPendingStageId(selectedProgress), [selectedProgress])
  const activeStage = stageFlow.find((stage) => stage.id === nextStageId) ?? stageFlow.at(-1) ?? null
  const canSaveReflection = reflectionDraft.trim().length >= REFLECTION_MIN_LENGTH
  const canRevealSolution = selectedProgress.attempts >= 2 || selectedProgress.completed

  const validateCheckpoint = () => {
    if (!checkpoint || selectedOptionIndex === null) {
      setCheckpointFeedback('Selecciona una opcion para validar tu comprension.')
      return
    }

    if (selectedOptionIndex === checkpoint.correctIndex) {
      onMarkLearned()
      setCheckpointFeedback(checkpoint.successMessage)
      return
    }

    setCheckpointFeedback('Respuesta incorrecta. Revisa el objetivo y vuelve a intentarlo.')
  }

  return (
    <Card id={cardId} className={cardClassName} role="tabpanel" aria-labelledby={ariaLabelledBy}>
      <CardHeader>
        <CardTitle>Laboratorio guiado</CardTitle>
        <CardDescription>Practica con checkpoints reales para consolidar logica antes de subir de nivel.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <PracticeGuidedSelectors
          selectedUnitId={selectedUnitId}
          selectedExerciseId={selectedExercise?.id ?? ''}
          exercisesByUnit={exercisesByUnit}
          exerciseAccessById={exerciseAccessById}
          unlockedUnitIds={unlockedUnitIds}
          onUnitChange={onUnitChange}
          onExerciseChange={onExerciseChange}
        />

        {selectedExercise ? (
          <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
            <PracticeMissionSummary
              selectedExercise={selectedExercise}
              selectedUnitTitle={selectedUnitTitle}
              selectedProgress={selectedProgress}
              selectedExerciseAccess={selectedExerciseAccess}
              nextStageLabel={nextStageId ?? 'Ruta completada'}
              canRevealSolution={canRevealSolution}
              onLoadExercise={onLoadExercise}
              onLoadSolution={onLoadSolution}
              onResetProgress={onResetProgress}
            />

            <PracticeStageRail stageFlow={stageFlow} selectedProgress={selectedProgress} />

            <PracticeActiveStageSection
              activeStage={activeStage}
              selectedExercise={selectedExercise}
              selectedProgress={selectedProgress}
              selectedExerciseAccess={selectedExerciseAccess}
              checkpoint={checkpoint}
              selectedOptionIndex={selectedOptionIndex}
              checkpointFeedback={checkpointFeedback}
              reflectionDraft={reflectionDraft}
              canSaveReflection={canSaveReflection}
              onOptionChange={setSelectedOptionIndex}
              onValidateCheckpoint={validateCheckpoint}
              onReflectionDraftChange={setReflectionDraft}
              onSaveReflection={() => onSaveReflection(reflectionDraft)}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
