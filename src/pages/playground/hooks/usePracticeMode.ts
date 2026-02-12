import { useMemo, useState } from 'react'
import {
  computePracticeMastery,
  createDefaultPracticeProgressEntry,
  getPracticeExerciseById,
  getPracticeExercisesByUnitId,
  getPracticeProgressEntry,
  getPracticeUnitById,
  loadPracticeProgress,
  practiceExercises,
  practiceStageFlow,
  practiceUnits,
  savePracticeProgress,
  type PracticeProgress,
  type PracticeUnitId,
} from '@/features/runtime/model/practiceExercises'
import { createPracticeModeActions } from '@/pages/playground/hooks/practice-mode/actions'

const initialExerciseId = practiceExercises[0]?.id ?? ''
const initialUnitId = practiceExercises[0]?.unitId ?? 'u1-fundamentos'

interface UsePracticeModeOptions {
  applyProgramTemplate: (source: string, inputs: Record<string, string>) => void
}

export function usePracticeMode({ applyProgramTemplate }: UsePracticeModeOptions) {
  const [selectedUnitId, setSelectedUnitId] = useState<PracticeUnitId>(initialUnitId)
  const [selectedExerciseId, setSelectedExerciseId] = useState(initialExerciseId)
  const [practiceProgress, setPracticeProgress] = useState<PracticeProgress>(() => loadPracticeProgress())

  const mastery = useMemo(() => computePracticeMastery(practiceUnits, practiceExercises, practiceProgress), [practiceProgress])

  const activeUnitId = useMemo(() => {
    if (mastery.unitMasteryById[selectedUnitId]?.unlocked) {
      return selectedUnitId
    }

    return mastery.unlockedUnitIds[0] ?? selectedUnitId
  }, [selectedUnitId, mastery.unitMasteryById, mastery.unlockedUnitIds])

  const exercisesByUnit = useMemo(() => getPracticeExercisesByUnitId(activeUnitId), [activeUnitId])
  const unlockedExercisesByUnit = useMemo(
    () => exercisesByUnit.filter((exercise) => mastery.exerciseAccessById[exercise.id]?.unlocked),
    [exercisesByUnit, mastery.exerciseAccessById],
  )

  const selectedUnit = useMemo(() => getPracticeUnitById(activeUnitId), [activeUnitId])
  const selectedExercise = useMemo(() => {
    const directMatch = getPracticeExerciseById(selectedExerciseId)
    if (directMatch && directMatch.unitId === activeUnitId && mastery.exerciseAccessById[directMatch.id]?.unlocked) {
      return directMatch
    }

    return unlockedExercisesByUnit[0] ?? exercisesByUnit[0] ?? null
  }, [selectedExerciseId, activeUnitId, exercisesByUnit, unlockedExercisesByUnit, mastery.exerciseAccessById])

  const selectedProgress = useMemo(() => {
    if (!selectedExercise) {
      return createDefaultPracticeProgressEntry()
    }

    return getPracticeProgressEntry(practiceProgress, selectedExercise.id)
  }, [practiceProgress, selectedExercise])

  const selectedExerciseAccess = useMemo(() => {
    if (!selectedExercise) {
      return { unlocked: false, reason: 'Sin ejercicio.' }
    }

    return mastery.exerciseAccessById[selectedExercise.id] ?? { unlocked: false, reason: 'Bloqueado.' }
  }, [mastery.exerciseAccessById, selectedExercise])

  const updatePracticeProgress = (updater: (current: PracticeProgress) => PracticeProgress) => {
    setPracticeProgress((current) => {
      const next = updater(current)
      savePracticeProgress(next)
      return next
    })
  }

  const [
    handleUnitChange,
    handleExerciseChange,
    markExerciseAttempt,
    markExerciseCreationFromSource,
    markExerciseCompleted,
    markExerciseStageCompleted,
    saveExerciseReflection,
    loadSelectedExercise,
    loadSelectedSolution,
    resetPractice,
  ] = createPracticeModeActions({
    mastery,
    selectedExercise,
    selectedExerciseAccess,
    applyProgramTemplate,
    setSelectedUnitId,
    setSelectedExerciseId,
    updatePracticeProgress,
  })

  return {
    selectedUnitId: activeUnitId,
    selectedExerciseId,
    exercisesByUnit,
    selectedUnit,
    selectedExercise,
    selectedProgress,
    selectedExerciseAccess,
    mastery,
    stageFlow: practiceStageFlow,
    setSelectedExerciseId: handleExerciseChange,
    handleUnitChange,
    markExerciseAttempt,
    markExerciseCreationFromSource,
    markExerciseCompleted,
    markExerciseStageCompleted,
    saveExerciseReflection,
    loadSelectedExercise,
    loadSelectedSolution,
    resetPractice,
  }
}
