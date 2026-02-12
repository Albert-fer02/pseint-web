import type { PracticeExercise } from '../types'

export const controlExercises: PracticeExercise[] = [
{
  id: 'comparar-numeros',
  unitId: 'u2-control',
  topic: 'Si / Sino Si / Sino',
  title: 'Comparar dos numeros',
  level: 'Basico',
  estimatedMinutes: 10,
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
  id: 'segun-notas',
  unitId: 'u2-control',
  topic: 'Segun',
  title: 'Clasificar nota con Segun',
  level: 'Basico',
  estimatedMinutes: 9,
  objective: 'Aplicar Segun para casos multiples.',
  instructions: [
    'Lee una nota entera entre 0 y 20.',
    'Clasifica: 18-20 Excelente, 14-17 Bueno, 11-13 Regular, otro Reforzar.',
    'Usa De Otro Modo para valores fuera de rango.',
  ],
  starterCode: `Algoritmo ClasificarNota
  Definir nota Como Entero;
  Leer nota;

  // TODO: completa los casos.
  Segun nota Hacer
      De Otro Modo:
          Escribir "Reforzar";
  FinSegun
FinAlgoritmo`,
  solutionCode: `Algoritmo ClasificarNota
  Definir nota Como Entero;
  Leer nota;

  Segun nota Hacer
      18,19,20:
          Escribir "Excelente";
      14,15,16,17:
          Escribir "Bueno";
      11,12,13:
          Escribir "Regular";
      De Otro Modo:
          Escribir "Reforzar";
  FinSegun
FinAlgoritmo`,
  starterInputs: {
    nota: '19',
  },
  expectedOutputLines: ['Excelente'],
},
{
  id: 'sumatoria-for',
  unitId: 'u2-control',
  topic: 'Para',
  title: 'Sumatoria con Para',
  level: 'Intermedio',
  estimatedMinutes: 8,
  objective: 'Acumular valores con ciclo Para.',
  instructions: [
    'Lee un limite n.',
    'Calcula la suma de 1 hasta n.',
    'Muestra el resultado final.',
  ],
  starterCode: `Algoritmo SumatoriaFor
  Definir i, n, suma Como Entero;
  Leer n;
  suma <- 0;

  // TODO: recorre del 1 al n y acumula.

  Escribir "Suma total: ", suma;
FinAlgoritmo`,
  solutionCode: `Algoritmo SumatoriaFor
  Definir i, n, suma Como Entero;
  Leer n;
  suma <- 0;

  Para i <- 1 Hasta n Con Paso 1 Hacer
      suma <- suma + i;
  FinPara

  Escribir "Suma total: ", suma;
FinAlgoritmo`,
  starterInputs: {
    n: '10',
  },
  expectedOutputLines: ['Suma total: 55'],
},
{
  id: 'factorial-mientras',
  unitId: 'u2-control',
  topic: 'Mientras',
  title: 'Factorial con Mientras',
  level: 'Intermedio',
  estimatedMinutes: 10,
  objective: 'Usar Mientras para una multiplicacion acumulada.',
  instructions: [
    'Lee n.',
    'Calcula n! con un contador incremental.',
    'Muestra Factorial: resultado.',
  ],
  starterCode: `Algoritmo FactorialMientras
  Definir n, i, factorial Como Entero;
  Leer n;

  i <- 1;
  factorial <- 1;

  // TODO: completa el ciclo Mientras.

  Escribir "Factorial: ", factorial;
FinAlgoritmo`,
  solutionCode: `Algoritmo FactorialMientras
  Definir n, i, factorial Como Entero;
  Leer n;

  i <- 1;
  factorial <- 1;

  Mientras i <= n Hacer
      factorial <- factorial * i;
      i <- i + 1;
  FinMientras

  Escribir "Factorial: ", factorial;
FinAlgoritmo`,
  starterInputs: {
    n: '5',
  },
  expectedOutputLines: ['Factorial: 120'],
},
{
  id: 'acumulado-repetir',
  unitId: 'u2-control',
  topic: 'Repetir Hasta Que',
  title: 'Acumulado descendente',
  level: 'Intermedio',
  estimatedMinutes: 10,
  objective: 'Practicar Repetir ... Hasta Que.',
  instructions: [
    'Lee n.',
    'Acumula n + (n-1) + ... + 1 con Repetir.',
    'Muestra el acumulado final.',
  ],
  starterCode: `Algoritmo AcumuladoRepetir
  Definir n, acumulado Como Entero;
  Leer n;
  acumulado <- 0;

  // TODO: usa Repetir ... Hasta Que para acumular.

  Escribir "Acumulado: ", acumulado;
FinAlgoritmo`,
  solutionCode: `Algoritmo AcumuladoRepetir
  Definir n, acumulado Como Entero;
  Leer n;
  acumulado <- 0;

  Repetir
      acumulado <- acumulado + n;
      n <- n - 1;
  Hasta Que n == 0

  Escribir "Acumulado: ", acumulado;
FinAlgoritmo`,
  starterInputs: {
    n: '4',
  },
  expectedOutputLines: ['Acumulado: 10'],
},
]
