import type { PracticeExercise } from '../types'
import { algoritmosExercises } from './algoritmos'
import { controlExercises } from './control'
import { estructurasExercises } from './estructuras'
import { fundamentosExercises } from './fundamentos'
import { modularidadExercises } from './modularidad'

export const practiceExercises: PracticeExercise[] = [
  ...fundamentosExercises,
  ...controlExercises,
  ...estructurasExercises,
  ...modularidadExercises,
  ...algoritmosExercises,
]
