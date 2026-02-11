import { describe, expect, it } from 'vitest'
import { extractInputFields } from '@/shared/lib/pseint/analyzer'
import { analyzeProgram } from '@/shared/lib/pseint/insights'
import { parseProgram } from '@/shared/lib/pseint/parser'

const nestedSource = `Algoritmo DemoInsights
    Definir nombre Como Cadena;
    Definir edad Como Entero;
    Definir activa Como Logico;

    Leer nombre;

    Si edad >= 18 Entonces
        Leer edad;
        Escribir "Mayor";
    Sino
        Leer activa;
        Escribir "Menor";
    FinSi

    Escribir "Listo";
FinAlgoritmo`

const loopSource = `Algoritmo DemoLoop
    Definir i, suma Como Entero;
    suma <- 0;
    Para i <- 1 Hasta 5 Con Paso 1 Hacer
        suma <- suma + i;
    FinPara
    Escribir suma;
FinAlgoritmo`

describe('extractInputFields', () => {
  it('collects nested Leer statements inside conditionals', () => {
    const ast = parseProgram(nestedSource)
    const fields = extractInputFields(ast)

    expect(fields.map((field) => field.name)).toEqual(['nombre', 'edad', 'activa'])
  })
})

describe('analyzeProgram', () => {
  it('returns static complexity metrics from source + AST', () => {
    const ast = parseProgram(nestedSource)
    const insights = analyzeProgram(nestedSource, ast)

    expect(insights.declarationCount).toBe(3)
    expect(insights.readCount).toBe(3)
    expect(insights.writeCount).toBe(3)
    expect(insights.conditionalCount).toBe(1)
    expect(insights.cyclomaticComplexity).toBe(2)
    expect(insights.complexityBand).toBe('Baja')
    expect(insights.guidance.length).toBeGreaterThan(0)
  })

  it('counts loops and updates complexity approximation', () => {
    const ast = parseProgram(loopSource)
    const insights = analyzeProgram(loopSource, ast)

    expect(insights.loopCount).toBe(1)
    expect(insights.cyclomaticComplexity).toBeGreaterThanOrEqual(2)
    expect(insights.timeComplexity).toContain('O(n)')
  })
})
