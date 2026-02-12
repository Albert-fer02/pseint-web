import { useMemo, useState } from 'react'
import {
  computePracticeMastery,
  createDefaultPracticeProgressEntry,
  getPracticeExerciseById,
  getPracticeExercisesByUnitId,
  getPracticeProgressEntry,
  getPracticeUnitById,
  loadPracticeProgress,
  normalizeSourceForProgress,
  practiceExercises,
  practiceUnits,
  recordPracticeAttempt,
  recordPracticeCreation,
  recordPracticeExecution,
  recordPracticeLearned,
  recordPracticeReflection,
  recordPracticeSolved,
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
      const now = new Date().toISOString()
      const nextEntry = recordPracticeAttempt(currentEntry, now)

      return {
        ...current,
        [exerciseId]: nextEntry,
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
      const now = new Date().toISOString()
      const nextEntry = recordPracticeCreation(
        currentEntry,
        {
          currentSource,
          starterSource,
          solutionSource,
        },
        now,
      )
      return {
        ...current,
        [exerciseId]: nextEntry,
      }
    })
  }

  const markExerciseCompleted = (exerciseId: string) => {
    updatePracticeProgress((current) => {
      const currentEntry = getPracticeProgressEntry(current, exerciseId)
      const now = new Date().toISOString()
      const nextEntry = recordPracticeSolved(currentEntry, now)

      return {
        ...current,
        [exerciseId]: nextEntry,
      }
    })
  }

  const markExerciseStageCompleted = (exerciseId: string, stageId: PracticeStageId) => {
    updatePracticeProgress((current) => {
      const currentEntry = getPracticeProgressEntry(current, exerciseId)
      const now = new Date().toISOString()
      const nextEntry = getNextEntryByStage(stageId, currentEntry, now)
      return {
        ...current,
        [exerciseId]: nextEntry,
      }
    })
  }

  const saveExerciseReflection = (exerciseId: string, note: string) => {
    updatePracticeProgress((current) => {
      const currentEntry = getPracticeProgressEntry(current, exerciseId)
      const now = new Date().toISOString()
      const nextEntry = recordPracticeReflection(currentEntry, note, now)
      return {
        ...current,
        [exerciseId]: nextEntry,
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

function getNextEntryByStage(
  stageId: PracticeStageId,
  currentEntry: PracticeProgressEntry,
  now: string,
) {
  if (stageId === 'aprende') {
    return recordPracticeLearned(currentEntry, now)
  }

  if (stageId === 'ejecuta') {
    return recordPracticeExecution(currentEntry, now)
  }

  return currentEntry
}
