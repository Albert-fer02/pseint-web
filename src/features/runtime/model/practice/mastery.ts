import type {
  PracticeExercise,
  PracticeLevel,
  PracticeProgress,
  PracticeProgressEntry,
  PracticeStageId,
  PracticeUnit,
  PracticeUnitId,
} from './types'

export interface PracticeStageDefinition {
  id: PracticeStageId
  title: string
  description: string
}

export interface PracticeExerciseAccess {
  unlocked: boolean
  reason: string | null
}

export interface PracticeUnitMastery {
  unitId: PracticeUnitId
  unlocked: boolean
  completionRate: number
  completedCount: number
  totalCount: number
  unlockRequirement: string | null
  levelCompletionRate: Record<PracticeLevel, number>
}

export interface PracticeMasterySnapshot {
  unitMasteryById: Record<PracticeUnitId, PracticeUnitMastery>
  exerciseAccessById: Record<string, PracticeExerciseAccess>
  overallCompletionRate: number
  unlockedUnitIds: PracticeUnitId[]
}

const LEVEL_ORDER: PracticeLevel[] = ['Basico', 'Intermedio', 'Avanzado']

export const UNIT_MASTERY_UNLOCK_THRESHOLD = 70
export const LEVEL_MASTERY_UNLOCK_THRESHOLD = 60

export const practiceStageFlow: PracticeStageDefinition[] = [
  {
    id: 'aprende',
    title: 'Aprende',
    description: 'Lee objetivo, tema y pasos del ejercicio.',
  },
  {
    id: 'practica',
    title: 'Practica',
    description: 'Intenta resolver el caso base.',
  },
  {
    id: 'crea',
    title: 'Crea',
    description: 'Ajusta tu propia solucion sin ver la respuesta.',
  },
  {
    id: 'ejecuta',
    title: 'Ejecuta',
    description: 'Corre el programa y revisa salida/traza.',
  },
  {
    id: 'resuelve',
    title: 'Resuelve',
    description: 'Alcanza la salida esperada del reto.',
  },
  {
    id: 'reflexiona',
    title: 'Reflexiona',
    description: 'Escribe que mejorarias para el siguiente intento.',
  },
]

export function isStageCompleted(entry: PracticeProgressEntry, stageId: PracticeStageId): boolean {
  return Boolean(entry.stageCompletedAt[stageId])
}

export function isStageUnlocked(entry: PracticeProgressEntry, stageId: PracticeStageId): boolean {
  for (const stage of practiceStageFlow) {
    if (stage.id === stageId) {
      return true
    }

    if (!isStageCompleted(entry, stage.id)) {
      return false
    }
  }

  return true
}

export function getNextPendingStageId(entry: PracticeProgressEntry): PracticeStageId | null {
  for (const stage of practiceStageFlow) {
    if (!isStageCompleted(entry, stage.id)) {
      return stage.id
    }
  }

  return null
}

export function computePracticeMastery(
  units: PracticeUnit[],
  exercises: PracticeExercise[],
  progress: PracticeProgress,
): PracticeMasterySnapshot {
  const unitMasteryById = {} as Record<PracticeUnitId, PracticeUnitMastery>
  const exerciseAccessById: Record<string, PracticeExerciseAccess> = {}
  const unlockedUnitIds: PracticeUnitId[] = []

  let previousUnitCompletion = 100

  for (const [index, unit] of units.entries()) {
    const unitExercises = exercises.filter((exercise) => exercise.unitId === unit.id)
    const completedCount = unitExercises.filter((exercise) => progress[exercise.id]?.completed).length
    const completionRate = calculateCompletionRate(completedCount, unitExercises.length)

    const unlocked = index === 0 || previousUnitCompletion >= UNIT_MASTERY_UNLOCK_THRESHOLD
    if (unlocked) {
      unlockedUnitIds.push(unit.id)
    }

    const levelCompletionRate = calculateLevelCompletion(unitExercises, progress)
    const unlockRequirement =
      index === 0
        ? null
        : `Completa ${UNIT_MASTERY_UNLOCK_THRESHOLD}% de la unidad anterior para desbloquear esta unidad.`

    unitMasteryById[unit.id] = {
      unitId: unit.id,
      unlocked,
      completionRate,
      completedCount,
      totalCount: unitExercises.length,
      unlockRequirement,
      levelCompletionRate,
    }

    const levelUnlocked = getUnitLevelUnlocked(levelCompletionRate)
    for (const exercise of unitExercises) {
      const access = getExerciseAccess(exercise, unlocked, levelUnlocked)
      exerciseAccessById[exercise.id] = access
    }

    previousUnitCompletion = completionRate
  }

  const totalExercises = exercises.length
  const totalCompleted = exercises.filter((exercise) => progress[exercise.id]?.completed).length

  return {
    unitMasteryById,
    exerciseAccessById,
    overallCompletionRate: calculateCompletionRate(totalCompleted, totalExercises),
    unlockedUnitIds,
  }
}

function calculateLevelCompletion(
  unitExercises: PracticeExercise[],
  progress: PracticeProgress,
): Record<PracticeLevel, number> {
  const rates = {
    Basico: 100,
    Intermedio: 100,
    Avanzado: 100,
  }

  for (const level of LEVEL_ORDER) {
    const levelExercises = unitExercises.filter((exercise) => exercise.level === level)
    if (levelExercises.length === 0) {
      rates[level] = 100
      continue
    }

    const completedCount = levelExercises.filter((exercise) => progress[exercise.id]?.completed).length
    rates[level] = calculateCompletionRate(completedCount, levelExercises.length)
  }

  return rates
}

function getUnitLevelUnlocked(levelCompletionRate: Record<PracticeLevel, number>): Record<PracticeLevel, boolean> {
  return {
    Basico: true,
    Intermedio: levelCompletionRate.Basico >= LEVEL_MASTERY_UNLOCK_THRESHOLD,
    Avanzado: levelCompletionRate.Intermedio >= LEVEL_MASTERY_UNLOCK_THRESHOLD,
  }
}

function getExerciseAccess(
  exercise: PracticeExercise,
  unitUnlocked: boolean,
  levelUnlocked: Record<PracticeLevel, boolean>,
): PracticeExerciseAccess {
  if (!unitUnlocked) {
    return {
      unlocked: false,
      reason: `Unidad bloqueada: necesitas ${UNIT_MASTERY_UNLOCK_THRESHOLD}% en la unidad previa.`,
    }
  }

  if (levelUnlocked[exercise.level]) {
    return {
      unlocked: true,
      reason: null,
    }
  }

  if (exercise.level === 'Intermedio') {
    return {
      unlocked: false,
      reason: `Completa ${LEVEL_MASTERY_UNLOCK_THRESHOLD}% de ejercicios Basico para desbloquear Intermedio.`,
    }
  }

  return {
    unlocked: false,
    reason: `Completa ${LEVEL_MASTERY_UNLOCK_THRESHOLD}% de ejercicios Intermedio para desbloquear Avanzado.`,
  }
}

function calculateCompletionRate(completed: number, total: number): number {
  if (total === 0) {
    return 0
  }

  return Math.round((completed / total) * 100)
}
