import type { PracticeExercise } from '../types'

export const fundamentosExercises: PracticeExercise[] = [
{
  id: 'variables-saludo',
  unitId: 'u1-fundamentos',
  topic: 'Variables y tipos',
  title: 'Variables y saludo',
  level: 'Basico',
  estimatedMinutes: 8,
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
  id: 'constantes-igv',
  unitId: 'u1-fundamentos',
  topic: 'Constantes',
  title: 'Total con constante IGV',
  level: 'Basico',
  estimatedMinutes: 9,
  objective: 'Usar Constante para formulas sin valores magicos.',
  instructions: [
    'Declara una constante IGV = 0.18.',
    'Lee un subtotal.',
    'Muestra el total aplicando IGV.',
  ],
  starterCode: `Algoritmo TotalConIGV
  Definir subtotal, total Como Real;
  Constante IGV <- 0.18;
  Leer subtotal;

  // TODO: usa la constante IGV en la formula.
  total <- subtotal;

  Escribir "Total: ", total;
FinAlgoritmo`,
  solutionCode: `Algoritmo TotalConIGV
  Definir subtotal, total Como Real;
  Constante IGV <- 0.18;
  Leer subtotal;

  total <- subtotal + subtotal * IGV;

  Escribir "Total: ", total;
FinAlgoritmo`,
  starterInputs: {
    subtotal: '100',
  },
  expectedOutputLines: ['Total: 118'],
},
]
