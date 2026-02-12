import { useMemo, useState } from 'react'
import {
  createDefaultPracticeProgressEntry,
  getPracticeExerciseById,
  getPracticeExercisesByUnitId,
  getPracticeProgressEntry,
  getPracticeUnitById,
  loadPracticeProgress,
  savePracticeProgress,
  practiceExercises,
  type PracticeProgress,
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

  const exercisesByUnit = useMemo(() => getPracticeExercisesByUnitId(selectedUnitId), [selectedUnitId])
  const selectedUnit = useMemo(() => getPracticeUnitById(selectedUnitId), [selectedUnitId])
  const selectedExercise = useMemo(() => {
    const directMatch = getPracticeExerciseById(selectedExerciseId)
    if (directMatch && directMatch.unitId === selectedUnitId) {
      return directMatch
    }

    return exercisesByUnit[0] ?? null
  }, [selectedExerciseId, selectedUnitId, exercisesByUnit])

  const selectedProgress = useMemo(() => {
    if (!selectedExercise) {
      return createDefaultPracticeProgressEntry()
    }

    return getPracticeProgressEntry(practiceProgress, selectedExercise.id)
  }, [practiceProgress, selectedExercise])

  const updatePracticeProgress = (updater: (current: PracticeProgress) => PracticeProgress) => {
    setPracticeProgress((current) => {
      const next = updater(current)
      savePracticeProgress(next)
      return next
    })
  }

  const handleUnitChange = (nextUnitId: PracticeUnitId) => {
    setSelectedUnitId(nextUnitId)
    const fallbackExercise = getPracticeExercisesByUnitId(nextUnitId)[0]
    if (fallbackExercise) {
      setSelectedExerciseId(fallbackExercise.id)
    }
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

  return {
    selectedUnitId,
    selectedExerciseId,
    practiceProgress,
    exercisesByUnit,
    selectedUnit,
    selectedExercise,
    selectedProgress,
    setSelectedExerciseId,
    handleUnitChange,
    markExerciseAttempt,
    markExerciseCompleted,
    loadSelectedExercise,
    loadSelectedSolution,
    resetPractice,
  }
}
