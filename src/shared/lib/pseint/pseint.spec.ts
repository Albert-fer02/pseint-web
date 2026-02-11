import { describe, expect, it } from 'vitest'
import { parseProgram } from '@/shared/lib/pseint/parser'
import { executeProgram } from '@/shared/lib/pseint/interpreter'

const source = `Algoritmo VariablesBasicas
    Definir nombre Como Cadena;
    Definir edad Como Entero;
    Definir altura Como Real;
    Definir esMayorDeEdad Como Logico;
    Definir inicial Como Caracter;

    Leer nombre;
    Leer edad;
    Leer altura;

    esMayorDeEdad <- edad >= 18;
    inicial <- Subcadena(nombre, 1, 1);

    Escribir "Hola, ", nombre, "!";
    Si esMayorDeEdad Entonces
        Escribir "Eres mayor de edad";
    Sino
        Escribir "Eres menor de edad";
    FinSi
FinAlgoritmo`

const matrixAndFunctionSource = `Algoritmo MatrizYSubprocesos
    Definir matriz[3,3] Como Entero;
    Definir fila, columna Como Entero;

    Para fila <- 1 Hasta 3 Con Paso 1 Hacer
        Para columna <- 1 Hasta 3 Con Paso 1 Hacer
            matriz[fila,columna] <- fila * columna;
        FinPara
    FinPara

    Escribir "Matriz generada:";
    Para fila <- 1 Hasta 3 Con Paso 1 Hacer
        Para columna <- 1 Hasta 3 Con Paso 1 Hacer
            Escribir matriz[fila,columna], " " Sin Saltar;
        FinPara
        Escribir "";
    FinPara

    Definir total Como Entero;
    total <- sumarMatriz(matriz, 3);
    Escribir "Suma total de la matriz: ", total;
FinAlgoritmo

Funcion suma <- sumarMatriz(mat[ , ], tam)
    Definir f, c, acum Como Entero;
    acum <- 0;
    Para f <- 1 Hasta tam Con Paso 1 Hacer
        Para c <- 1 Hasta tam Con Paso 1 Hacer
            acum <- acum + mat[f,c];
        FinPara
    FinPara
    suma <- acum;
FinFuncion`

describe('parseProgram', () => {
  it('parses declarations and statements', () => {
    const ast = parseProgram(source)
    expect(ast.name).toBe('VariablesBasicas')
    expect(ast.declarations).toHaveLength(5)
    expect(ast.statements.length).toBeGreaterThan(0)
  })

  it('supports declaration lists in a single Definir', () => {
    const listDeclarationsSource = `Algoritmo Demo
    Definir num1, num2, suma, producto Como Real;
    Definir nombre Como Cadena;
    Leer num1;
    Leer num2;
FinAlgoritmo`

    const ast = parseProgram(listDeclarationsSource)
    expect(ast.declarations.map((declaration) => declaration.name)).toEqual([
      'num1',
      'num2',
      'suma',
      'producto',
      'nombre',
    ])
  })

  it('supports array declarations', () => {
    const arraySource = `Algoritmo DemoArray
    Definir notas[5] Como Real;
    notas[1] <- 10;
    Escribir notas[1];
FinAlgoritmo`

    const ast = parseProgram(arraySource)
    expect(ast.declarations).toHaveLength(1)
    expect(ast.declarations[0]?.name).toBe('notas')
    expect(ast.declarations[0]?.dimensions).toEqual([5])
  })

  it('supports Sino Si chains', () => {
    const elseIfSource = `Algoritmo DemoElseIf
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
FinAlgoritmo`

    const ast = parseProgram(elseIfSource)
    expect(ast.statements.some((statement) => statement.kind === 'if')).toBe(true)
  })

  it('supports Para loops with optional paso', () => {
    const forSource = `Algoritmo DemoPara
    Definir contador, suma Como Entero;
    suma <- 0;
    Para contador <- 1 Hasta 3 Hacer
        suma <- suma + contador;
    FinPara
    Escribir suma;
FinAlgoritmo`

    const ast = parseProgram(forSource)
    expect(ast.statements.some((statement) => statement.kind === 'for')).toBe(true)
  })

  it('supports Definir statements after executable lines', () => {
    const inlineDeclarationSource = `Algoritmo DemoDefinirIntermedio
    Definir a Como Entero;
    a <- 1;
    Definir b Como Entero;
    b <- a + 1;
    Escribir b;
FinAlgoritmo`

    const ast = parseProgram(inlineDeclarationSource)
    expect(ast.declarations.map((declaration) => declaration.name)).toEqual(['a', 'b'])
  })

  it('supports matrix declarations, matrix indexing and function blocks', () => {
    const ast = parseProgram(matrixAndFunctionSource)
    expect(ast.declarations.find((declaration) => declaration.name === 'matriz')?.dimensions).toEqual([3, 3])
    expect(ast.functions).toHaveLength(1)
    expect(ast.functions[0]?.name).toBe('sumarMatriz')
  })
})

describe('executeProgram', () => {
  it('executes basic flow with if branch', () => {
    const ast = parseProgram(source)
    const result = executeProgram(ast, {
      nombre: 'Ana',
      edad: '20',
      altura: '1.68',
    })

    expect(result.outputs[0]).toBe('Hola, Ana!')
    expect(result.outputs[1]).toContain('mayor')
    expect(result.variables.inicial).toBe('A')
  })

  it('throws when an expected input is missing', () => {
    const ast = parseProgram(source)
    expect(() => executeProgram(ast, { nombre: 'Ana' })).toThrowError(/Falta valor/)
  })

  it('executes the Sino Si branch when condition matches', () => {
    const elseIfSource = `Algoritmo DemoElseIf
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
FinAlgoritmo`

    const ast = parseProgram(elseIfSource)
    const result = executeProgram(ast, { num1: '5', num2: '8' })
    expect(result.outputs[0]).toBe('num2 es mayor')
  })

  it('executes Para loop and accumulates values', () => {
    const forSource = `Algoritmo DemoPara
    Definir contador, suma Como Entero;
    suma <- 0;
    Para contador <- 1 Hasta 4 Con Paso 1 Hacer
        suma <- suma + contador;
    FinPara
    Escribir suma;
FinAlgoritmo`

    const ast = parseProgram(forSource)
    const result = executeProgram(ast, {})
    expect(result.outputs[0]).toBe('10')
    expect(result.variables.suma).toBe(10)
  })

  it('executes array assignments and reads array elements', () => {
    const arraySource = `Algoritmo DemoArrayExec
    Definir notas[5] Como Real;
    notas[1] <- 9.5;
    notas[2] <- 7.2;
    Escribir notas[1], " - ", notas[2];
FinAlgoritmo`

    const ast = parseProgram(arraySource)
    const result = executeProgram(ast, {})

    expect(result.outputs[0]).toBe('9.5 - 7.2')
    expect(result.variables.notas).toEqual([9.5, 7.2, 0, 0, 0])
  })

  it('executes program with Definir inside flow', () => {
    const inlineDeclarationSource = `Algoritmo DemoDefinirIntermedio
    Definir a Como Entero;
    a <- 1;
    Definir b Como Entero;
    b <- a + 1;
    Escribir b;
FinAlgoritmo`

    const ast = parseProgram(inlineDeclarationSource)
    const result = executeProgram(ast, {})
    expect(result.outputs[0]).toBe('2')
    expect(result.variables.b).toBe(2)
  })

  it('executes matrix + function flow with Sin Saltar', () => {
    const ast = parseProgram(matrixAndFunctionSource)
    const result = executeProgram(ast, {})

    expect(result.outputs).toEqual([
      'Matriz generada:',
      '1 2 3 ',
      '2 4 6 ',
      '3 6 9 ',
      'Suma total de la matriz: 36',
    ])
    expect(result.variables.total).toBe(36)
  })
})
