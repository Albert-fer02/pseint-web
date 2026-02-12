import { describe, expect, it } from 'vitest'
import {
  computePracticeMastery,
  createDefaultPracticeProgressEntry,
  getPracticeProgressEntry,
  isStageUnlocked,
  practiceExercises,
  practiceStageFlow,
  practiceUnits,
  type PracticeProgress,
} from '@/features/runtime/model/practiceExercises'

describe('practice mastery rules', () => {
  it('unlocks only first unit when there is no progress', () => {
    const mastery = computePracticeMastery(practiceUnits, practiceExercises, {})

    expect(mastery.unlockedUnitIds).toEqual(['u1-fundamentos'])
    expect(mastery.unitMasteryById['u2-control']?.unlocked).toBe(false)
  })

  it('unlocks next unit after meeting previous unit threshold', () => {
    const progress: PracticeProgress = {
      'variables-saludo': {
        ...createDefaultPracticeProgressEntry(),
        completed: true,
      },
      'constantes-igv': {
        ...createDefaultPracticeProgressEntry(),
        completed: true,
      },
    }

    const mastery = computePracticeMastery(practiceUnits, practiceExercises, progress)

    expect(mastery.unitMasteryById['u2-control']?.unlocked).toBe(true)
  })

  it('keeps intermedio locked until basico mastery is reached in a unit', () => {
    const progress: PracticeProgress = {
      'variables-saludo': {
        ...createDefaultPracticeProgressEntry(),
        completed: true,
      },
      'constantes-igv': {
        ...createDefaultPracticeProgressEntry(),
        completed: true,
      },
    }

    const mastery = computePracticeMastery(practiceUnits, practiceExercises, progress)

    expect(mastery.exerciseAccessById['sumatoria-for']?.unlocked).toBe(false)

    progress['comparar-numeros'] = {
      ...createDefaultPracticeProgressEntry(),
      completed: true,
    }
    progress['segun-notas'] = {
      ...createDefaultPracticeProgressEntry(),
      completed: true,
    }

    const unlockedMastery = computePracticeMastery(practiceUnits, practiceExercises, progress)
    expect(unlockedMastery.exerciseAccessById['sumatoria-for']?.unlocked).toBe(true)
  })

  it('unlocks stages in strict sequence', () => {
    const entry = createDefaultPracticeProgressEntry()
    expect(isStageUnlocked(entry, 'aprende')).toBe(true)
    expect(isStageUnlocked(entry, 'practica')).toBe(false)

    const aprende = practiceStageFlow.find((stage) => stage.id === 'aprende')
    if (!aprende) {
      throw new Error('Stage aprende missing')
    }

    const progressed = {
      ...entry,
      stageCompletedAt: { aprende: new Date().toISOString() },
    }

    expect(isStageUnlocked(progressed, 'practica')).toBe(true)
  })

  it('provides default progress entry for missing exercise progress', () => {
    const entry = getPracticeProgressEntry({}, 'variables-saludo')
    expect(entry.completed).toBe(false)
    expect(entry.attempts).toBe(0)
  })
})
