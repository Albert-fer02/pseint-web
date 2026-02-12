import type { PracticeExercise } from '../types'

export const estructurasExercises: PracticeExercise[] = [
{
  id: 'vector-promedio',
  unitId: 'u3-estructuras',
  topic: 'Vectores',
  title: 'Vector y promedio',
  level: 'Intermedio',
  estimatedMinutes: 12,
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
{
  id: 'matriz-diagonal',
  unitId: 'u3-estructuras',
  topic: 'Matrices',
  title: 'Suma diagonal de matriz 2x2',
  level: 'Intermedio',
  estimatedMinutes: 12,
  objective: 'Trabajar lectura y acceso de matriz bidimensional.',
  instructions: [
    'Declara matriz 2x2.',
    'Lee las cuatro posiciones.',
    'Calcula y muestra la suma de la diagonal principal.',
  ],
  starterCode: `Algoritmo MatrizDiagonal
  Definir matriz[2,2] Como Entero;
  Definir diagonal Como Entero;

  Leer matriz[1,1];
  Leer matriz[1,2];
  Leer matriz[2,1];
  Leer matriz[2,2];

  // TODO: calcula diagonal principal.
  diagonal <- 0;

  Escribir "Diagonal: ", diagonal;
FinAlgoritmo`,
  solutionCode: `Algoritmo MatrizDiagonal
  Definir matriz[2,2] Como Entero;
  Definir diagonal Como Entero;

  Leer matriz[1,1];
  Leer matriz[1,2];
  Leer matriz[2,1];
  Leer matriz[2,2];

  diagonal <- matriz[1,1] + matriz[2,2];

  Escribir "Diagonal: ", diagonal;
FinAlgoritmo`,
  starterInputs: {
    'matriz[1,1]': '4',
    'matriz[1,2]': '7',
    'matriz[2,1]': '2',
    'matriz[2,2]': '6',
  },
  expectedOutputLines: ['Diagonal: 10'],
},
]
