import type { PracticeExercise } from '../types'

export const modularidadExercises: PracticeExercise[] = [
{
  id: 'cadenas-basico',
  unitId: 'u4-modularidad',
  topic: 'Cadenas',
  title: 'Procesamiento de cadenas',
  level: 'Intermedio',
  estimatedMinutes: 10,
  objective: 'Aplicar funciones de cadena en un caso simple.',
  instructions: [
    'Lee un texto.',
    'Muestra su longitud, inicial y version en mayusculas.',
    'Usa Longitud, Subcadena y Mayusculas.',
  ],
  starterCode: `Algoritmo CadenasBasico
  Definir texto, inicial, mayus Como Cadena;
  Definir largo Como Entero;
  Leer texto;

  // TODO: completa calculos.
  inicial <- "";
  mayus <- "";
  largo <- 0;

  Escribir "Inicial: ", inicial;
  Escribir "Mayus: ", mayus;
  Escribir "Longitud: ", largo;
FinAlgoritmo`,
  solutionCode: `Algoritmo CadenasBasico
  Definir texto, inicial, mayus Como Cadena;
  Definir largo Como Entero;
  Leer texto;

  inicial <- Subcadena(texto, 1, 1);
  mayus <- Mayusculas(texto);
  largo <- Longitud(texto);

  Escribir "Inicial: ", inicial;
  Escribir "Mayus: ", mayus;
  Escribir "Longitud: ", largo;
FinAlgoritmo`,
  starterInputs: {
    texto: 'Ana',
  },
  expectedOutputLines: ['Inicial: A', 'Mayus: ANA', 'Longitud: 3'],
},
{
  id: 'funcion-promedio',
  unitId: 'u4-modularidad',
  topic: 'Funciones',
  title: 'Promedio con funcion',
  level: 'Intermedio',
  estimatedMinutes: 15,
  objective: 'Delegar calculo de promedio a una funcion.',
  instructions: [
    'Lee tres notas en un vector.',
    'Crea una funcion que retorne el promedio.',
    'Muestra el resultado final.',
  ],
  starterCode: `Algoritmo PromedioConFuncion
  Definir notas[3] Como Real;
  Definir promedio Como Real;

  Leer notas[1];
  Leer notas[2];
  Leer notas[3];

  // TODO: usa la funcion.
  promedio <- 0;

  Escribir "Promedio: ", promedio;
FinAlgoritmo

Funcion resultado <- calcularPromedio(vector[])
  // TODO: implementa la funcion.
  resultado <- 0;
FinFuncion`,
  solutionCode: `Algoritmo PromedioConFuncion
  Definir notas[3] Como Real;
  Definir promedio Como Real;

  Leer notas[1];
  Leer notas[2];
  Leer notas[3];

  promedio <- calcularPromedio(notas);

  Escribir "Promedio: ", promedio;
FinAlgoritmo

Funcion resultado <- calcularPromedio(vector[])
  Definir suma Como Real;
  suma <- vector[1] + vector[2] + vector[3];
  resultado <- suma / 3;
FinFuncion`,
  starterInputs: {
    'notas[1]': '12',
    'notas[2]': '16',
    'notas[3]': '14',
  },
  expectedOutputLines: ['Promedio: 14'],
},
{
  id: 'procedimiento-saludo',
  unitId: 'u4-modularidad',
  topic: 'Procedimientos',
  title: 'Saludo con SubProceso',
  level: 'Intermedio',
  estimatedMinutes: 12,
  objective: 'Separar salida en un SubProceso sin retorno.',
  instructions: [
    'Lee el nombre del usuario.',
    'Llama a un SubProceso para mostrar el saludo.',
    'No uses funcion con retorno para este caso.',
  ],
  starterCode: `Algoritmo SaludoConSubProceso
  Definir nombre Como Cadena;
  Leer nombre;

  // TODO: llama al subproceso.
FinAlgoritmo

SubProceso mostrarSaludo(texto)
  // TODO: imprimir saludo.
FinSubProceso`,
  solutionCode: `Algoritmo SaludoConSubProceso
  Definir nombre Como Cadena;
  Leer nombre;

  mostrarSaludo(nombre);
FinAlgoritmo

SubProceso mostrarSaludo(texto)
  Escribir "Hola ", texto;
FinSubProceso`,
  starterInputs: {
    nombre: 'Lucia',
  },
  expectedOutputLines: ['Hola Lucia'],
},
{
  id: 'referencia-triplicar',
  unitId: 'u4-modularidad',
  topic: 'Parametros por referencia',
  title: 'Modificar valor por referencia',
  level: 'Avanzado',
  estimatedMinutes: 15,
  objective: 'Actualizar una variable del programa principal desde un SubProceso.',
  instructions: [
    'Lee un numero entero.',
    'Crea un SubProceso que reciba el parametro por referencia.',
    'Triplica el valor dentro del SubProceso y muestra el resultado final.',
  ],
  starterCode: `Algoritmo ParametroPorReferencia
  Definir numero Como Entero;
  Leer numero;

  // TODO: llamar subproceso por referencia.
  Escribir "Resultado: ", numero;
FinAlgoritmo

SubProceso triplicar(valor Por Referencia)
  // TODO: modificar valor.
FinSubProceso`,
  solutionCode: `Algoritmo ParametroPorReferencia
  Definir numero Como Entero;
  Leer numero;

  triplicar(numero);
  Escribir "Resultado: ", numero;
FinAlgoritmo

SubProceso triplicar(valor Por Referencia)
  valor <- valor * 3;
FinSubProceso`,
  starterInputs: {
    numero: '7',
  },
  expectedOutputLines: ['Resultado: 21'],
},
]
