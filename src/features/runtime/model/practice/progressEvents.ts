import { completeStageIfAllowed, hasValidReflection } from './stageProgress'
import type { PracticeProgressEntry } from './types'

export interface PracticeSourceSnapshot {
  currentSource: string
  starterSource: string
  solutionSource: string
}

export const SOLUTION_REVIEW_MIN_ATTEMPTS = 2

export function recordPracticeLearned(
  entry: PracticeProgressEntry,
  atIso: string = new Date().toISOString(),
): PracticeProgressEntry {
  return completeStageIfAllowed(entry, 'aprende', atIso)
}

export function recordPracticeAttempt(
  entry: PracticeProgressEntry,
  atIso: string = new Date().toISOString(),
): PracticeProgressEntry {
  const nextEntry = completeStageIfAllowed(entry, 'practica', atIso)

  return {
    ...nextEntry,
    attempts: entry.attempts + 1,
    lastAttemptAt: atIso,
  }
}

export function recordPracticeCreation(
  entry: PracticeProgressEntry,
  sourceSnapshot: PracticeSourceSnapshot,
  atIso: string = new Date().toISOString(),
): PracticeProgressEntry {
  if (!isValidCreatedSource(entry, sourceSnapshot)) {
    return entry
  }

  return completeStageIfAllowed(entry, 'crea', atIso)
}

export function recordPracticeExecution(
  entry: PracticeProgressEntry,
  atIso: string = new Date().toISOString(),
): PracticeProgressEntry {
  return completeStageIfAllowed(entry, 'ejecuta', atIso)
}

export function recordPracticeSolved(
  entry: PracticeProgressEntry,
  atIso: string = new Date().toISOString(),
): PracticeProgressEntry {
  const nextEntry = completeStageIfAllowed(entry, 'resuelve', atIso)
  const solved = Boolean(nextEntry.stageCompletedAt.resuelve)

  return {
    ...nextEntry,
    completed: entry.completed || solved,
    completedAt: entry.completedAt ?? (solved ? atIso : null),
  }
}

export function recordPracticeReflection(
  entry: PracticeProgressEntry,
  note: string,
  atIso: string = new Date().toISOString(),
): PracticeProgressEntry {
  if (!hasValidReflection(note)) {
    return entry
  }

  const nextEntry = completeStageIfAllowed(entry, 'reflexiona', atIso)

  return {
    ...nextEntry,
    reflectionNote: note.trim(),
  }
}

export function normalizeSourceForProgress(source: string): string {
  return source.replace(/\s+/g, ' ').trim()
}

function isValidCreatedSource(
  entry: PracticeProgressEntry,
  sourceSnapshot: PracticeSourceSnapshot,
): boolean {
  const current = normalizeSourceForProgress(sourceSnapshot.currentSource)
  const starter = normalizeSourceForProgress(sourceSnapshot.starterSource)
  const solution = normalizeSourceForProgress(sourceSnapshot.solutionSource)

  if (!current || current === starter) {
    return false
  }

  if (current === solution && entry.attempts < SOLUTION_REVIEW_MIN_ATTEMPTS && !entry.completed) {
    return false
  }

  return true
}
