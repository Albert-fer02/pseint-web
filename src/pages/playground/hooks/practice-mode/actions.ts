import {
  getPracticeExerciseById,
  getPracticeExercisesByUnitId,
  getPracticeProgressEntry,
  normalizeSourceForProgress,
  recordPracticeAttempt,
  recordPracticeCreation,
  recordPracticeExecution,
  recordPracticeLearned,
  recordPracticeReflection,
  recordPracticeSolved,
  type PracticeExercise,
  type PracticeExerciseAccess,
  type PracticeMasterySnapshot,
  type PracticeProgress,
  type PracticeProgressEntry,
  type PracticeStageId,
  type PracticeUnitId,
} from '@/features/runtime/model/practiceExercises'

interface PracticeModeActionsArgs {
  mastery: PracticeMasterySnapshot
  selectedExercise: PracticeExercise | null
  selectedExerciseAccess: PracticeExerciseAccess
  applyProgramTemplate: (source: string, inputs: Record<string, string>) => void
  setSelectedUnitId: (unitId: PracticeUnitId) => void
  setSelectedExerciseId: (exerciseId: string) => void
  updatePracticeProgress: (updater: (current: PracticeProgress) => PracticeProgress) => void
}

export function createPracticeModeActions({
  mastery,
  selectedExercise,
  selectedExerciseAccess,
  applyProgramTemplate,
  setSelectedUnitId,
  setSelectedExerciseId,
  updatePracticeProgress,
}: PracticeModeActionsArgs) {
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
    updatePracticeProgress(() => ({}))
  }

  return [
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
  ] as const
}

function getNextEntryByStage(stageId: PracticeStageId, currentEntry: PracticeProgressEntry, now: string) {
  if (stageId === 'aprende') {
    return recordPracticeLearned(currentEntry, now)
  }

  if (stageId === 'ejecuta') {
    return recordPracticeExecution(currentEntry, now)
  }

  return currentEntry
}
