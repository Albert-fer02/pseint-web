import { describe, expect, it } from 'vitest'
import { parseProgram } from '@/shared/lib/pseint/parser'
import { practiceExercises, practiceUnits } from '@/features/runtime/model/practiceExercises'

describe('practiceExercises integrity', () => {
  it('has unique ids', () => {
    const ids = practiceExercises.map((exercise) => exercise.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('assigns each exercise to an existing unit', () => {
    const unitIds = new Set(practiceUnits.map((unit) => unit.id))
    for (const exercise of practiceExercises) {
      expect(unitIds.has(exercise.unitId)).toBe(true)
    }
  })

  it('keeps solutionCode parseable for all exercises', () => {
    for (const exercise of practiceExercises) {
      expect(() => parseProgram(exercise.solutionCode)).not.toThrow()
    }
  })
})
