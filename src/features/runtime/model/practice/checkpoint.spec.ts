import { describe, expect, it } from 'vitest'
import { buildPracticeCheckpoint, type PracticeExercise } from '@/features/runtime/model/practiceExercises'

const baseExercise: PracticeExercise = {
  id: 'test-checkpoint',
  unitId: 'u1-fundamentos',
  topic: 'Variables',
  title: 'Saludo inicial',
  level: 'Basico',
  estimatedMinutes: 10,
  objective: 'Mostrar un saludo usando variables.',
  instructions: ['Define variables y muestra un mensaje.'],
  starterCode: 'Algoritmo saludo\nFinAlgoritmo',
  solutionCode: 'Algoritmo saludo\nFinAlgoritmo',
  starterInputs: {},
}

describe('buildPracticeCheckpoint', () => {
  it('uses exercise objective without trailing dot', () => {
    const checkpoint = buildPracticeCheckpoint(baseExercise)

    expect(checkpoint.correctIndex).toBe(0)
    expect(checkpoint.options[0]).toBe('Mostrar un saludo usando variables')
  })

  it('uses fallback objective when objective is blank', () => {
    const checkpoint = buildPracticeCheckpoint({
      ...baseExercise,
      objective: '   ',
    })

    expect(checkpoint.options[0]).toBe('Resolver el problema usando la logica indicada en el ejercicio.')
  })
})
