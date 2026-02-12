import type { PracticeProgressEntry, PracticeStageId } from './types'
import { isStageCompleted, isStageUnlocked } from './mastery'

export const REFLECTION_MIN_LENGTH = 20

export function completeStageIfAllowed(
  entry: PracticeProgressEntry,
  stageId: PracticeStageId,
  completedAt: string = new Date().toISOString(),
): PracticeProgressEntry {
  if (isStageCompleted(entry, stageId)) {
    return entry
  }

  if (!isStageUnlocked(entry, stageId)) {
    return entry
  }

  return {
    ...entry,
    stageCompletedAt: {
      ...entry.stageCompletedAt,
      [stageId]: completedAt,
    },
  }
}

export function hasValidReflection(note: string): boolean {
  return note.trim().length >= REFLECTION_MIN_LENGTH
}
