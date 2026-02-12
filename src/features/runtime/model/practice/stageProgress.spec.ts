import { describe, expect, it } from 'vitest'
import { createDefaultPracticeProgressEntry } from '@/features/runtime/model/practiceExercises'
import {
  completeStageIfAllowed,
  hasValidReflection,
  REFLECTION_MIN_LENGTH,
} from './stageProgress'

describe('practice stage progress', () => {
  it('does not complete a stage when previous stage is not unlocked', () => {
    const entry = createDefaultPracticeProgressEntry()

    const result = completeStageIfAllowed(entry, 'practica', '2026-02-12T00:00:00.000Z')

    expect(result.stageCompletedAt.aprende).toBeUndefined()
    expect(result.stageCompletedAt.practica).toBeUndefined()
  })

  it('completes only the requested stage without auto-cascade', () => {
    const entry = createDefaultPracticeProgressEntry()

    const learned = completeStageIfAllowed(entry, 'aprende', '2026-02-12T00:00:00.000Z')
    const practiced = completeStageIfAllowed(learned, 'practica', '2026-02-12T00:01:00.000Z')

    expect(practiced.stageCompletedAt.aprende).toBe('2026-02-12T00:00:00.000Z')
    expect(practiced.stageCompletedAt.practica).toBe('2026-02-12T00:01:00.000Z')
    expect(practiced.stageCompletedAt.crea).toBeUndefined()
    expect(practiced.stageCompletedAt.ejecuta).toBeUndefined()
  })

  it('keeps existing timestamp when stage is already completed', () => {
    const entry = {
      ...createDefaultPracticeProgressEntry(),
      stageCompletedAt: {
        aprende: '2026-02-12T00:00:00.000Z',
      },
    }

    const result = completeStageIfAllowed(entry, 'aprende', '2026-02-12T00:05:00.000Z')

    expect(result.stageCompletedAt.aprende).toBe('2026-02-12T00:00:00.000Z')
  })

  it('validates reflection minimum length', () => {
    expect(hasValidReflection('')).toBe(false)
    expect(hasValidReflection('texto corto')).toBe(false)
    expect(hasValidReflection('a'.repeat(REFLECTION_MIN_LENGTH))).toBe(true)
  })
})
