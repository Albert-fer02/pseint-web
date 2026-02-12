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
  practiceUnits,
  practiceStageFlow,
  savePracticeProgress,
  type PracticeProgress,
  type PracticeProgressEntry,
  type PracticeStageId,
  type PracticeUnitId,
} from '@/features/runtime/model/practiceExercises'

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
  const selectedUnitUnlocked = mastery.unitMasteryById[activeUnitId]?.unlocked ?? false
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
      return { unlocked: false, reason: 'No hay ejercicio disponible.' }
    }

    return mastery.exerciseAccessById[selectedExercise.id] ?? { unlocked: false, reason: 'Ejercicio bloqueado.' }
  }, [mastery.exerciseAccessById, selectedExercise])

  const updatePracticeProgress = (updater: (current: PracticeProgress) => PracticeProgress) => {
    setPracticeProgress((current) => {
      const next = updater(current)
      savePracticeProgress(next)
      return next
    })
  }

  const handleUnitChange = (nextUnitId: PracticeUnitId) => {
    const unitMastery = mastery.unitMasteryById[nextUnitId]
    if (!unitMastery?.unlocked) {
      return
    }

    setSelectedUnitId(nextUnitId)
    const fallbackExercise = getPracticeExercisesByUnitId(nextUnitId).find((exercise) => mastery.exerciseAccessById[exercise.id]?.unlocked)
    if (fallbackExercise) {
      setSelectedExerciseId(fallbackExercise.id)
    }
  }

  const handleExerciseChange = (exerciseId: string) => {
    if (!mastery.exerciseAccessById[exerciseId]?.unlocked) {
      return
    }

    setSelectedExerciseId(exerciseId)
  }

  const markExerciseAttempt = (exerciseId: string) => {
    updatePracticeProgress((current) => {
      const currentEntry = getPracticeProgressEntry(current, exerciseId)
      return {
        ...current,
        [exerciseId]: {
          ...completeStage(currentEntry, 'practica'),
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
          ...completeStage(currentEntry, 'resuelve'),
          completed: true,
          completedAt: currentEntry.completedAt ?? new Date().toISOString(),
        },
      }
    })
  }

  const markExerciseStageCompleted = (exerciseId: string, stageId: PracticeStageId) => {
    updatePracticeProgress((current) => {
      const currentEntry = getPracticeProgressEntry(current, exerciseId)
      return {
        ...current,
        [exerciseId]: completeStage(currentEntry, stageId),
      }
    })
  }

  const saveExerciseReflection = (exerciseId: string, note: string) => {
    const trimmed = note.trim()
    if (!trimmed) {
      return
    }

    updatePracticeProgress((current) => {
      const currentEntry = getPracticeProgressEntry(current, exerciseId)
      const nextEntry = completeStage(currentEntry, 'reflexiona')
      return {
        ...current,
        [exerciseId]: {
          ...nextEntry,
          reflectionNote: trimmed,
        },
      }
    })
  }

  const loadSelectedExercise = () => {
    if (!selectedExercise || !selectedExerciseAccess.unlocked) {
      return
    }

    applyProgramTemplate(selectedExercise.starterCode, selectedExercise.starterInputs)
    markExerciseStageCompleted(selectedExercise.id, 'aprende')
  }

  const loadSelectedSolution = () => {
    if (!selectedExercise || !selectedExerciseAccess.unlocked) {
      return
    }

    applyProgramTemplate(selectedExercise.solutionCode, selectedExercise.starterInputs)
  }

  const resetPractice = () => {
    savePracticeProgress({})
    setPracticeProgress({})
  }

  return {
    selectedUnitId: activeUnitId,
    selectedExerciseId,
    practiceProgress,
    exercisesByUnit,
    selectedUnit,
    selectedExercise,
    selectedProgress,
    selectedExerciseAccess,
    selectedUnitUnlocked,
    mastery,
    stageFlow: practiceStageFlow,
    setSelectedExerciseId: handleExerciseChange,
    handleUnitChange,
    markExerciseAttempt,
    markExerciseCompleted,
    markExerciseStageCompleted,
    saveExerciseReflection,
    loadSelectedExercise,
    loadSelectedSolution,
    resetPractice,
  }
}

function completeStage(
  entry: PracticeProgressEntry,
  stageId: PracticeStageId,
): PracticeProgressEntry {
  const now = new Date().toISOString()
  const stageCompletedAt = { ...entry.stageCompletedAt }

  for (const stage of practiceStageFlow) {
    if (!stageCompletedAt[stage.id]) {
      stageCompletedAt[stage.id] = now
    }

    if (stage.id === stageId) {
      break
    }
  }

  return {
    ...entry,
    stageCompletedAt,
  }
}
