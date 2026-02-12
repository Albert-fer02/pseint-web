import type { PracticeUnit } from './types'

export const practiceUnits: PracticeUnit[] = [
{
  id: 'u1-fundamentos',
  title: 'Unidad 1: Fundamentos',
  description: 'Variables, tipos, E/S y expresiones.',
  topics: [
    { id: 'variables', title: 'Variables y tipos', status: 'disponible' },
    { id: 'constantes', title: 'Constantes', status: 'disponible' },
    { id: 'io', title: 'Leer y Escribir', status: 'disponible' },
    { id: 'expresiones', title: 'Operadores y expresiones', status: 'disponible' },
  ],
},
{
  id: 'u2-control',
  title: 'Unidad 2: Control de Flujo',
  description: 'Condicionales y estructuras repetitivas.',
  topics: [
    { id: 'if', title: 'Si / Sino / Sino Si', status: 'disponible' },
    { id: 'segun', title: 'Segun', status: 'disponible' },
    { id: 'for', title: 'Para', status: 'disponible' },
    { id: 'while-repeat', title: 'Mientras / Repetir Hasta Que', status: 'disponible' },
  ],
},
{
  id: 'u3-estructuras',
  title: 'Unidad 3: Arreglos y Matrices',
  description: 'Estructuras 1D y 2D para recorridos y operaciones.',
  topics: [
    { id: 'vectores', title: 'Vectores (1D)', status: 'disponible' },
    { id: 'matrices', title: 'Matrices (2D)', status: 'disponible' },
    { id: 'indices', title: 'Indices desde 1', status: 'disponible' },
  ],
},
{
  id: 'u4-modularidad',
  title: 'Unidad 4: Modularidad y Cadenas',
  description: 'Funciones, parametros y operaciones de texto.',
  topics: [
    { id: 'funciones', title: 'Funciones', status: 'disponible' },
    { id: 'procedimientos', title: 'Procedimientos', status: 'disponible' },
    { id: 'referencia', title: 'Parametros por referencia', status: 'disponible' },
    { id: 'strings', title: 'Subcadena, Longitud, Mayusculas, Minusculas, Concatenar', status: 'disponible' },
  ],
},
{
  id: 'u5-algoritmos',
  title: 'Unidad 5: Algoritmos Clasicos',
  description: 'Busqueda, ordenamiento y problemas integradores.',
  topics: [
    { id: 'busqueda-sec', title: 'Busqueda secuencial', status: 'disponible' },
    { id: 'busqueda-bin', title: 'Busqueda binaria', status: 'disponible' },
    { id: 'ordenamiento', title: 'Burbuja / Insercion / Seleccion', status: 'disponible' },
  ],
},
]
