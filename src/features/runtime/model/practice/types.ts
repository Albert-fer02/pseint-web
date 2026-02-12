export type PracticeLevel = 'Basico' | 'Intermedio' | 'Avanzado'

export type PracticeUnitId =
  | 'u1-fundamentos'
  | 'u2-control'
  | 'u3-estructuras'
  | 'u4-modularidad'
  | 'u5-algoritmos'

export type TopicStatus = 'disponible' | 'parcial' | 'planificado'

export interface PracticeTopic {
  id: string
  title: string
  status: TopicStatus
}

export interface PracticeUnit {
  id: PracticeUnitId
  title: string
  description: string
  topics: PracticeTopic[]
}

export interface PracticeExercise {
  id: string
  unitId: PracticeUnitId
  topic: string
  title: string
  level: PracticeLevel
  estimatedMinutes: number
  objective: string
  instructions: string[]
  starterCode: string
  solutionCode: string
  starterInputs: Record<string, string>
  expectedOutputLines?: string[]
}

export interface PracticeProgressEntry {
  attempts: number
  completed: boolean
  lastAttemptAt: string | null
  completedAt: string | null
}

export type PracticeProgress = Record<string, PracticeProgressEntry>
