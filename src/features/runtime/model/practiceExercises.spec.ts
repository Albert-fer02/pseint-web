import { describe, expect, it } from 'vitest'
import { parseProgram } from '@/shared/lib/pseint/parser'
import {
  getPracticeExerciseById,
  getPracticeExercisesByUnitId,
  getPracticeUnitById,
  practiceExercises,
  practiceUnits,
} from '@/features/runtime/model/practiceExercises'

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

  it('resolves exercise and unit selectors', () => {
    const firstExercise = practiceExercises[0]
    const firstUnit = practiceUnits[0]

    expect(getPracticeExerciseById(firstExercise.id)).toEqual(firstExercise)
    expect(getPracticeExerciseById('exercise-missing')).toBeNull()

    expect(getPracticeUnitById(firstUnit.id)).toEqual(firstUnit)
    expect(getPracticeUnitById('u1-fundamentos')).not.toBeNull()
  })

  it('returns only exercises that belong to the selected unit', () => {
    const firstUnit = practiceUnits[0]
    const unitExercises = getPracticeExercisesByUnitId(firstUnit.id)

    expect(unitExercises.length).toBeGreaterThan(0)
    expect(unitExercises.every((exercise) => exercise.unitId === firstUnit.id)).toBe(true)
  })
})
