import { beforeEach, describe, expect, it } from 'vitest'
import {
  createDefaultPracticeProgressEntry,
  getPracticeProgressEntry,
  loadPracticeProgress,
  savePracticeProgress,
} from '@/features/runtime/model/practiceExercises'

const STORAGE_KEY = 'pseint.practice.progress.v1'

describe('practice progress persistence', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('creates a default progress entry', () => {
    expect(createDefaultPracticeProgressEntry()).toEqual({
      attempts: 0,
      completed: false,
      lastAttemptAt: null,
      completedAt: null,
      stageCompletedAt: {},
      reflectionNote: null,
    })
  })

  it('returns existing progress entry when available', () => {
    const existing = createDefaultPracticeProgressEntry()
    existing.attempts = 2

    const result = getPracticeProgressEntry({ 'exercise-1': existing }, 'exercise-1')

    expect(result.attempts).toBe(2)
  })

  it('returns default entry when progress is missing', () => {
    const result = getPracticeProgressEntry({}, 'exercise-missing')

    expect(result).toEqual(createDefaultPracticeProgressEntry())
  })

  it('loads empty state when storage contains invalid json', () => {
    window.localStorage.setItem(STORAGE_KEY, '{broken')

    expect(loadPracticeProgress()).toEqual({})
  })

  it('normalizes invalid persisted fields', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ex1: {
          attempts: 'x',
          completed: 1,
          lastAttemptAt: 9,
          completedAt: 1,
          stageCompletedAt: { aprende: 100 },
          reflectionNote: 7,
        },
      }),
    )

    expect(loadPracticeProgress()).toEqual({
      ex1: {
        attempts: 0,
        completed: true,
        lastAttemptAt: null,
        completedAt: null,
        stageCompletedAt: {},
        reflectionNote: null,
      },
    })
  })

  it('saves and reloads progress', () => {
    const progress = {
      ex1: {
        attempts: 3,
        completed: false,
        lastAttemptAt: '2026-02-12T18:00:00.000Z',
        completedAt: null,
        stageCompletedAt: { aprende: '2026-02-12T18:00:01.000Z' },
        reflectionNote: 'Necesito reforzar condicionales.',
      },
    }

    savePracticeProgress(progress)

    expect(loadPracticeProgress()).toEqual(progress)
  })
})
