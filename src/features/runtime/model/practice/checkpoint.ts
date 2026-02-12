import type { PracticeExercise } from './types'

export interface PracticeCheckpoint {
  question: string
  options: string[]
  correctIndex: number
  successMessage: string
}

export function buildPracticeCheckpoint(exercise: PracticeExercise): PracticeCheckpoint {
  const objective = sanitizeObjective(exercise.objective)

  return {
    question: `Antes de programar, identifica el objetivo principal de "${exercise.title}".`,
    options: [
      objective,
      'Solo memorizar sintaxis sin ejecutar el algoritmo.',
      'Evitar usar variables, ciclos o condiciones para simplificar.',
    ],
    correctIndex: 0,
    successMessage: 'Objetivo correcto. Ya puedes avanzar a la practica.',
  }
}

function sanitizeObjective(value: string): string {
  const normalized = value.trim()
  if (!normalized) {
    return 'Resolver el problema usando la logica indicada en el ejercicio.'
  }

  if (normalized.endsWith('.')) {
    return normalized.slice(0, -1)
  }

  return normalized
}
