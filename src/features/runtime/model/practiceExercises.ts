export type PracticeLevel = 'Basico' | 'Intermedio'

export interface PracticeExercise {
  id: string
  title: string
  level: PracticeLevel
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

const PRACTICE_PROGRESS_KEY = 'pseint.practice.progress.v1'

export const practiceExercises: PracticeExercise[] = [
  {
    id: 'variables-saludo',
    title: 'Variables y saludo',
    level: 'Basico',
    objective: 'Declarar variables, leer datos y mostrar resultados.',
    instructions: [
      'Pide nombre y edad con Leer.',
      'Calcula si es mayor de edad.',
      'Muestra un mensaje personalizado.',
    ],
    starterCode: `Algoritmo EjercicioVariables
    Definir nombre Como Cadena;
    Definir edad Como Entero;
    Definir esMayor Como Logico;

    Escribir "Ingresa tu nombre: ";
    Leer nombre;
    Escribir "Ingresa tu edad: ";
    Leer edad;

    // TODO: reemplaza este valor por la condicion real.
    esMayor <- Falso;

    Escribir "Hola ", nombre;
    Si esMayor Entonces
        Escribir "Eres mayor de edad";
    Sino
        Escribir "Eres menor de edad";
    FinSi
FinAlgoritmo`,
    solutionCode: `Algoritmo EjercicioVariables
    Definir nombre Como Cadena;
    Definir edad Como Entero;
    Definir esMayor Como Logico;

    Escribir "Ingresa tu nombre: ";
    Leer nombre;
    Escribir "Ingresa tu edad: ";
    Leer edad;

    esMayor <- edad >= 18;

    Escribir "Hola ", nombre;
    Si esMayor Entonces
        Escribir "Eres mayor de edad";
    Sino
        Escribir "Eres menor de edad";
    FinSi
FinAlgoritmo`,
    starterInputs: {
      nombre: 'Ana',
      edad: '20',
    },
    expectedOutputLines: [
      'Ingresa tu nombre: ',
      'Ingresa tu edad: ',
      'Hola Ana',
      'Eres mayor de edad',
    ],
  },
  {
    id: 'comparar-numeros',
    title: 'Comparar dos numeros',
    level: 'Basico',
    objective: 'Usar Si / Sino Si / Sino para comparar valores.',
    instructions: [
      'Lee dos numeros.',
      'Muestra cual es mayor o si son iguales.',
      'Evita duplicar condiciones innecesarias.',
    ],
    starterCode: `Algoritmo CompararNumeros
    Definir num1, num2 Como Real;
    Leer num1;
    Leer num2;

    // TODO: completa las condiciones.
    Si num1 > num2 Entonces
        Escribir "num1 es mayor";
    Sino
        Escribir "num2 es mayor";
    FinSi
FinAlgoritmo`,
    solutionCode: `Algoritmo CompararNumeros
    Definir num1, num2 Como Real;
    Leer num1;
    Leer num2;

    Si num1 > num2 Entonces
        Escribir "num1 es mayor";
    Sino Si num1 < num2 Entonces
        Escribir "num2 es mayor";
    Sino
        Escribir "son iguales";
    FinSi
FinAlgoritmo`,
    starterInputs: {
      num1: '7',
      num2: '7',
    },
    expectedOutputLines: ['son iguales'],
  },
  {
    id: 'vector-promedio',
    title: 'Vector y promedio',
    level: 'Intermedio',
    objective: 'Recorrer un vector, acumular valores y calcular promedio.',
    instructions: [
      'Declara un arreglo de 3 notas.',
      'Llena cada posicion con Leer.',
      'Calcula el promedio final.',
    ],
    starterCode: `Algoritmo PromedioVector
    Definir notas[3] Como Real;
    Definir suma, promedio Como Real;

    suma <- 0;

    Escribir "Nota 1: ";
    Leer notas[1];
    Escribir "Nota 2: ";
    Leer notas[2];
    Escribir "Nota 3: ";
    Leer notas[3];

    // TODO: completa la suma real.
    promedio <- 0;

    Escribir "Promedio: ", promedio;
FinAlgoritmo`,
    solutionCode: `Algoritmo PromedioVector
    Definir notas[3] Como Real;
    Definir suma, promedio Como Real;

    suma <- 0;

    Escribir "Nota 1: ";
    Leer notas[1];
    Escribir "Nota 2: ";
    Leer notas[2];
    Escribir "Nota 3: ";
    Leer notas[3];

    suma <- notas[1] + notas[2] + notas[3];
    promedio <- suma / 3;

    Escribir "Promedio: ", promedio;
FinAlgoritmo`,
    starterInputs: {
      'notas[1]': '8',
      'notas[2]': '7',
      'notas[3]': '9',
    },
    expectedOutputLines: [
      'Nota 1: ',
      'Nota 2: ',
      'Nota 3: ',
      'Promedio: 8',
    ],
  },
]

export function getPracticeExerciseById(id: string): PracticeExercise | null {
  const match = practiceExercises.find((exercise) => exercise.id === id)
  return match ?? null
}

export function createDefaultPracticeProgressEntry(): PracticeProgressEntry {
  return {
    attempts: 0,
    completed: false,
    lastAttemptAt: null,
    completedAt: null,
  }
}

export function getPracticeProgressEntry(progress: PracticeProgress, exerciseId: string): PracticeProgressEntry {
  return progress[exerciseId] ?? createDefaultPracticeProgressEntry()
}

export function loadPracticeProgress(): PracticeProgress {
  if (typeof window === 'undefined') {
    return {}
  }

  const raw = window.localStorage.getItem(PRACTICE_PROGRESS_KEY)
  if (!raw) {
    return {}
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, Partial<PracticeProgressEntry>>
    return Object.fromEntries(
      Object.entries(parsed).map(([exerciseId, value]) => [
        exerciseId,
        {
          attempts: typeof value.attempts === 'number' ? value.attempts : 0,
          completed: Boolean(value.completed),
          lastAttemptAt: typeof value.lastAttemptAt === 'string' ? value.lastAttemptAt : null,
          completedAt: typeof value.completedAt === 'string' ? value.completedAt : null,
        },
      ]),
    )
  } catch {
    return {}
  }
}

export function savePracticeProgress(progress: PracticeProgress): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(PRACTICE_PROGRESS_KEY, JSON.stringify(progress))
}
