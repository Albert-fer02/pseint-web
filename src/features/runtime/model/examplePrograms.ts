import { defaultInputs, defaultProgram } from '@/features/runtime/model/defaultProgram'

export interface ExampleProgram {
  id: string
  title: string
  level: 'Basico' | 'Intermedio'
  source: string
  inputs: Record<string, string>
}

export const examplePrograms: ExampleProgram[] = [
  {
    id: 'variables-basicas',
    title: 'Variables basicas',
    level: 'Basico',
    source: defaultProgram,
    inputs: defaultInputs,
  },
  {
    id: 'comparar-dos-numeros',
    title: 'Comparar dos numeros',
    level: 'Basico',
    source: `Algoritmo CompararDosNumeros
    Definir num1, num2 Como Real;

    Escribir "Ingresa el primer numero:";
    Leer num1;
    Escribir "Ingresa el segundo numero:";
    Leer num2;

    Si num1 > num2 Entonces
        Escribir "num1 es mayor";
    Sino
        Si num1 < num2 Entonces
            Escribir "num2 es mayor";
        Sino
            Escribir "son iguales";
        FinSi
    FinSi
FinAlgoritmo`,
    inputs: {
      num1: '8',
      num2: '4',
    },
  },
  {
    id: 'sumatoria-for',
    title: 'Sumatoria con Para',
    level: 'Intermedio',
    source: `Algoritmo SumatoriaFor
    Definir i, suma Como Entero;
    suma <- 0;

    Para i <- 1 Hasta 10 Con Paso 1 Hacer
        suma <- suma + i;
    FinPara

    Escribir "Suma total: ", suma;
FinAlgoritmo`,
    inputs: {},
  },
]

export function getExampleProgramById(id: string): ExampleProgram | undefined {
  return examplePrograms.find((example) => example.id === id)
}
