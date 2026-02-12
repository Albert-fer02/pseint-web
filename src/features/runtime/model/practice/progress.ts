import type { PracticeProgress, PracticeProgressEntry } from './types'

const PRACTICE_PROGRESS_KEY = 'pseint.practice.progress.v1'

export function createDefaultPracticeProgressEntry(): PracticeProgressEntry {
  return {
    attempts: 0,
    completed: false,
    lastAttemptAt: null,
    completedAt: null,
    stageCompletedAt: {},
    reflectionNote: null,
  }
}

export function getPracticeProgressEntry(progress: PracticeProgress, exerciseId: string): PracticeProgressEntry {
  return progress[exerciseId] ?? createDefaultPracticeProgressEntry()
}

export function loadPracticeProgress(): PracticeProgress {
  if (typeof window === 'undefined') {
    return {}
  }

  const raw = window.localStorage.getItem(PRACTICE_PROGRESS_KEY)
  if (!raw) {
    return {}
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, Partial<PracticeProgressEntry>>
    return Object.fromEntries(
      Object.entries(parsed).map(([exerciseId, value]) => [
        exerciseId,
        {
          attempts: typeof value.attempts === 'number' ? value.attempts : 0,
          completed: Boolean(value.completed),
          lastAttemptAt: typeof value.lastAttemptAt === 'string' ? value.lastAttemptAt : null,
          completedAt: typeof value.completedAt === 'string' ? value.completedAt : null,
          stageCompletedAt: isStageCompletedAt(value.stageCompletedAt) ? value.stageCompletedAt : {},
          reflectionNote: typeof value.reflectionNote === 'string' ? value.reflectionNote : null,
        },
      ]),
    )
  } catch {
    return {}
  }
}

function isStageCompletedAt(value: unknown): value is PracticeProgressEntry['stageCompletedAt'] {
  if (!value || typeof value !== 'object') {
    return false
  }

  for (const completedAt of Object.values(value)) {
    if (completedAt !== null && typeof completedAt !== 'string') {
      return false
    }
  }

  return true
}

export function savePracticeProgress(progress: PracticeProgress): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(PRACTICE_PROGRESS_KEY, JSON.stringify(progress))
}
