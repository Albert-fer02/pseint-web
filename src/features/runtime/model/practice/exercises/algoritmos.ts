import type { PracticeExercise } from '../types'

export const algoritmosExercises: PracticeExercise[] = [
{
  id: 'busqueda-secuencial',
  unitId: 'u5-algoritmos',
  topic: 'Busqueda secuencial',
  title: 'Busqueda secuencial en vector',
  level: 'Intermedio',
  estimatedMinutes: 14,
  objective: 'Encontrar la posicion de un elemento con recorrido lineal.',
  instructions: [
    'Inicializa un vector de 5 enteros.',
    'Lee el valor buscado.',
    'Muestra la posicion o un mensaje de no encontrado.',
  ],
  starterCode: `Algoritmo BusquedaSecuencial
  Definir datos[5] Como Entero;
  Definir buscado, i, posicion Como Entero;

  datos[1] <- 8;
  datos[2] <- 3;
  datos[3] <- 15;
  datos[4] <- 22;
  datos[5] <- 7;

  Leer buscado;
  posicion <- 0;

  // TODO: recorre y busca.

  Si posicion > 0 Entonces
      Escribir "Encontrado en: ", posicion;
  Sino
      Escribir "No encontrado";
  FinSi
FinAlgoritmo`,
  solutionCode: `Algoritmo BusquedaSecuencial
  Definir datos[5] Como Entero;
  Definir buscado, i, posicion Como Entero;

  datos[1] <- 8;
  datos[2] <- 3;
  datos[3] <- 15;
  datos[4] <- 22;
  datos[5] <- 7;

  Leer buscado;
  posicion <- 0;

  Para i <- 1 Hasta 5 Con Paso 1 Hacer
      Si datos[i] == buscado Entonces
          posicion <- i;
      FinSi
  FinPara

  Si posicion > 0 Entonces
      Escribir "Encontrado en: ", posicion;
  Sino
      Escribir "No encontrado";
  FinSi
FinAlgoritmo`,
  starterInputs: {
    buscado: '22',
  },
  expectedOutputLines: ['Encontrado en: 4'],
},
{
  id: 'burbuja-basica',
  unitId: 'u5-algoritmos',
  topic: 'Ordenamiento burbuja',
  title: 'Ordenamiento burbuja (5 datos)',
  level: 'Avanzado',
  estimatedMinutes: 20,
  objective: 'Implementar burbuja clasica y mostrar resultado.',
  instructions: [
    'Declara vector de 5 elementos desordenados.',
    'Ordena ascendente con dos ciclos.',
    'Muestra la secuencia final en una linea.',
  ],
  starterCode: `Algoritmo BurbujaBasica
  Definir datos[5] Como Entero;
  Definir i, j, temp Como Entero;

  datos[1] <- 5;
  datos[2] <- 1;
  datos[3] <- 4;
  datos[4] <- 2;
  datos[5] <- 3;

  // TODO: implementar burbuja.

  Escribir "Ordenado: " Sin Saltar;
  Para i <- 1 Hasta 5 Con Paso 1 Hacer
      Escribir datos[i], " " Sin Saltar;
  FinPara
  Escribir "";
FinAlgoritmo`,
  solutionCode: `Algoritmo BurbujaBasica
  Definir datos[5] Como Entero;
  Definir i, j, temp Como Entero;

  datos[1] <- 5;
  datos[2] <- 1;
  datos[3] <- 4;
  datos[4] <- 2;
  datos[5] <- 3;

  Para i <- 1 Hasta 4 Con Paso 1 Hacer
      Para j <- 1 Hasta 5 - i Con Paso 1 Hacer
          Si datos[j] > datos[j + 1] Entonces
              temp <- datos[j];
              datos[j] <- datos[j + 1];
              datos[j + 1] <- temp;
          FinSi
      FinPara
  FinPara

  Escribir "Ordenado: " Sin Saltar;
  Para i <- 1 Hasta 5 Con Paso 1 Hacer
      Escribir datos[i], " " Sin Saltar;
  FinPara
  Escribir "";
FinAlgoritmo`,
  starterInputs: {},
  expectedOutputLines: ['Ordenado: 1 2 3 4 5 '],
},
{
  id: 'insercion-basica',
  unitId: 'u5-algoritmos',
  topic: 'Ordenamiento insercion',
  title: 'Ordenamiento por insercion (5 datos)',
  level: 'Avanzado',
  estimatedMinutes: 20,
  objective: 'Implementar insercion para ordenar de menor a mayor.',
  instructions: [
    'Declara un vector con 5 datos desordenados.',
    'Recorre desde la segunda posicion e inserta en su lugar.',
    'Muestra el vector ordenado.',
  ],
  starterCode: `Algoritmo InsercionBasica
  Definir datos[5] Como Entero;
  Definir i, j, clave Como Entero;

  datos[1] <- 9;
  datos[2] <- 4;
  datos[3] <- 6;
  datos[4] <- 2;
  datos[5] <- 7;

  // TODO: implementar insercion.

  Escribir "Ordenado: " Sin Saltar;
  Para i <- 1 Hasta 5 Con Paso 1 Hacer
      Escribir datos[i], " " Sin Saltar;
  FinPara
  Escribir "";
FinAlgoritmo`,
  solutionCode: `Algoritmo InsercionBasica
  Definir datos[5] Como Entero;
  Definir i, j, clave Como Entero;

  datos[1] <- 9;
  datos[2] <- 4;
  datos[3] <- 6;
  datos[4] <- 2;
  datos[5] <- 7;

  Para i <- 2 Hasta 5 Con Paso 1 Hacer
      clave <- datos[i];
      j <- i - 1;
      Mientras j >= 1 Y datos[j] > clave Hacer
          datos[j + 1] <- datos[j];
          j <- j - 1;
      FinMientras
      datos[j + 1] <- clave;
  FinPara

  Escribir "Ordenado: " Sin Saltar;
  Para i <- 1 Hasta 5 Con Paso 1 Hacer
      Escribir datos[i], " " Sin Saltar;
  FinPara
  Escribir "";
FinAlgoritmo`,
  starterInputs: {},
  expectedOutputLines: ['Ordenado: 2 4 6 7 9 '],
},
{
  id: 'seleccion-basica',
  unitId: 'u5-algoritmos',
  topic: 'Ordenamiento seleccion',
  title: 'Ordenamiento por seleccion (5 datos)',
  level: 'Avanzado',
  estimatedMinutes: 20,
  objective: 'Implementar seleccion para ubicar el minimo en cada pasada.',
  instructions: [
    'Declara un vector de 5 enteros.',
    'Busca el minimo de la parte no ordenada en cada iteracion.',
    'Intercambia y muestra el resultado final.',
  ],
  starterCode: `Algoritmo SeleccionBasica
  Definir datos[5] Como Entero;
  Definir i, j, posMin, temp Como Entero;

  datos[1] <- 11;
  datos[2] <- 3;
  datos[3] <- 8;
  datos[4] <- 1;
  datos[5] <- 5;

  // TODO: implementar seleccion.

  Escribir "Ordenado: " Sin Saltar;
  Para i <- 1 Hasta 5 Con Paso 1 Hacer
      Escribir datos[i], " " Sin Saltar;
  FinPara
  Escribir "";
FinAlgoritmo`,
  solutionCode: `Algoritmo SeleccionBasica
  Definir datos[5] Como Entero;
  Definir i, j, posMin, temp Como Entero;

  datos[1] <- 11;
  datos[2] <- 3;
  datos[3] <- 8;
  datos[4] <- 1;
  datos[5] <- 5;

  Para i <- 1 Hasta 4 Con Paso 1 Hacer
      posMin <- i;
      Para j <- i + 1 Hasta 5 Con Paso 1 Hacer
          Si datos[j] < datos[posMin] Entonces
              posMin <- j;
          FinSi
      FinPara

      Si posMin != i Entonces
          temp <- datos[i];
          datos[i] <- datos[posMin];
          datos[posMin] <- temp;
      FinSi
  FinPara

  Escribir "Ordenado: " Sin Saltar;
  Para i <- 1 Hasta 5 Con Paso 1 Hacer
      Escribir datos[i], " " Sin Saltar;
  FinPara
  Escribir "";
FinAlgoritmo`,
  starterInputs: {},
  expectedOutputLines: ['Ordenado: 1 3 5 8 11 '],
},
{
  id: 'busqueda-binaria',
  unitId: 'u5-algoritmos',
  topic: 'Busqueda binaria',
  title: 'Busqueda binaria en vector ordenado',
  level: 'Avanzado',
  estimatedMinutes: 20,
  objective: 'Resolver busqueda binaria con limites inicio-fin.',
  instructions: [
    'Usa un vector ordenado de 7 datos.',
    'Lee el valor objetivo.',
    'Muestra su posicion o no encontrado.',
  ],
  starterCode: `Algoritmo BusquedaBinaria
  Definir datos[7] Como Entero;
  Definir inicio, fin, medio, buscado, posicion Como Entero;

  datos[1] <- 2;
  datos[2] <- 4;
  datos[3] <- 6;
  datos[4] <- 8;
  datos[5] <- 10;
  datos[6] <- 12;
  datos[7] <- 14;

  Leer buscado;
  inicio <- 1;
  fin <- 7;
  posicion <- 0;

  // TODO: completar busqueda binaria.

  Si posicion > 0 Entonces
      Escribir "Encontrado en: ", posicion;
  Sino
      Escribir "No encontrado";
  FinSi
FinAlgoritmo`,
  solutionCode: `Algoritmo BusquedaBinaria
  Definir datos[7] Como Entero;
  Definir inicio, fin, medio, buscado, posicion Como Entero;

  datos[1] <- 2;
  datos[2] <- 4;
  datos[3] <- 6;
  datos[4] <- 8;
  datos[5] <- 10;
  datos[6] <- 12;
  datos[7] <- 14;

  Leer buscado;
  inicio <- 1;
  fin <- 7;
  posicion <- 0;

  Mientras inicio <= fin Hacer
      medio <- (inicio + fin) / 2;

      Si datos[medio] == buscado Entonces
          posicion <- medio;
          inicio <- fin + 1;
      Sino Si buscado < datos[medio] Entonces
          fin <- medio - 1;
      Sino
          inicio <- medio + 1;
      FinSi
  FinMientras

  Si posicion > 0 Entonces
      Escribir "Encontrado en: ", posicion;
  Sino
      Escribir "No encontrado";
  FinSi
FinAlgoritmo`,
  starterInputs: {
    buscado: '10',
  },
  expectedOutputLines: ['Encontrado en: 5'],
},
]
