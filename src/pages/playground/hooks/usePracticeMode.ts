import { useMemo, useState } from 'react'
import {
  completeStageIfAllowed,
  computePracticeMastery,
  createDefaultPracticeProgressEntry,
  getPracticeExerciseById,
  getPracticeExercisesByUnitId,
  getPracticeProgressEntry,
  getPracticeUnitById,
  hasValidReflection,
  loadPracticeProgress,
  practiceExercises,
  practiceUnits,
  practiceStageFlow,
  savePracticeProgress,
  type PracticeProgress,
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
      const now = new Date().toISOString()
      const withPracticeStage = completeStageIfAllowed(currentEntry, 'practica', now)

      return {
        ...current,
        [exerciseId]: {
          ...withPracticeStage,
          attempts: currentEntry.attempts + 1,
          lastAttemptAt: now,
        },
      }
    })
  }

  const markExerciseCreationFromSource = (exerciseId: string, source: string) => {
    const exercise = getPracticeExerciseById(exerciseId)
    if (!exercise) {
      return
    }

    const currentSource = normalizeSourceForProgress(source)
    const starterSource = normalizeSourceForProgress(exercise.starterCode)
    const solutionSource = normalizeSourceForProgress(exercise.solutionCode)

    if (!currentSource || currentSource === starterSource || currentSource === solutionSource) {
      return
    }

    updatePracticeProgress((current) => {
      const currentEntry = getPracticeProgressEntry(current, exerciseId)
      return {
        ...current,
        [exerciseId]: completeStageIfAllowed(currentEntry, 'crea'),
      }
    })
  }

  const markExerciseCompleted = (exerciseId: string) => {
    updatePracticeProgress((current) => {
      const currentEntry = getPracticeProgressEntry(current, exerciseId)
      const now = new Date().toISOString()
      const withSolvedStage = completeStageIfAllowed(currentEntry, 'resuelve', now)
      const solved = Boolean(withSolvedStage.stageCompletedAt.resuelve)

      return {
        ...current,
        [exerciseId]: {
          ...withSolvedStage,
          completed: currentEntry.completed || solved,
          completedAt: currentEntry.completedAt ?? (solved ? now : null),
        },
      }
    })
  }

  const markExerciseStageCompleted = (exerciseId: string, stageId: PracticeStageId) => {
    updatePracticeProgress((current) => {
      const currentEntry = getPracticeProgressEntry(current, exerciseId)
      return {
        ...current,
        [exerciseId]: completeStageIfAllowed(currentEntry, stageId),
      }
    })
  }

  const saveExerciseReflection = (exerciseId: string, note: string) => {
    const trimmed = note.trim()
    if (!hasValidReflection(trimmed)) {
      return
    }

    updatePracticeProgress((current) => {
      const currentEntry = getPracticeProgressEntry(current, exerciseId)
      const nextEntry = completeStageIfAllowed(currentEntry, 'reflexiona')
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
    markExerciseCreationFromSource,
    markExerciseCompleted,
    markExerciseStageCompleted,
    saveExerciseReflection,
    loadSelectedExercise,
    loadSelectedSolution,
    resetPractice,
  }
}

function normalizeSourceForProgress(source: string): string {
  return source.replace(/\s+/g, ' ').trim()
}
