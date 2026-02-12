import { practiceExercises } from './practice/exercises'
import { practiceUnits } from './practice/units'
import type { PracticeExercise, PracticeUnit, PracticeUnitId } from './practice/types'

export type {
  PracticeExercise,
  PracticeLevel,
  PracticeProgress,
  PracticeProgressEntry,
  PracticeStageId,
  PracticeTopic,
  PracticeUnit,
  PracticeUnitId,
  TopicStatus,
} from './practice/types'

export { practiceExercises, practiceUnits }

export {
  createDefaultPracticeProgressEntry,
  getPracticeProgressEntry,
  loadPracticeProgress,
  savePracticeProgress,
} from './practice/progress'

export {
  computePracticeMastery,
  getNextPendingStageId,
  isStageCompleted,
  isStageUnlocked,
  LEVEL_MASTERY_UNLOCK_THRESHOLD,
  practiceStageFlow,
  UNIT_MASTERY_UNLOCK_THRESHOLD,
  type PracticeExerciseAccess,
  type PracticeMasterySnapshot,
  type PracticeStageDefinition,
  type PracticeUnitMastery,
} from './practice/mastery'

export {
  completeStageIfAllowed,
  hasValidReflection,
  REFLECTION_MIN_LENGTH,
} from './practice/stageProgress'

export {
  buildPracticeCheckpoint,
  type PracticeCheckpoint,
} from './practice/checkpoint'

export function getPracticeExerciseById(id: string): PracticeExercise | null {
  const match = practiceExercises.find((exercise) => exercise.id === id)
  return match ?? null
}

export function getPracticeUnitById(id: PracticeUnitId): PracticeUnit | null {
  const match = practiceUnits.find((unit) => unit.id === id)
  return match ?? null
}

export function getPracticeExercisesByUnitId(unitId: PracticeUnitId): PracticeExercise[] {
  return practiceExercises.filter((exercise) => exercise.unitId === unitId)
}
