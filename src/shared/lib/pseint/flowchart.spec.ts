import { describe, expect, it } from 'vitest'
import { buildFlowchart } from '@/shared/lib/pseint/flowchart'
import { parseProgram } from '@/shared/lib/pseint/parser'

describe('buildFlowchart', () => {
  it('builds start and end nodes for a simple algorithm', () => {
    const ast = parseProgram('Algoritmo Demo\nEscribir "Hola";\nFinAlgoritmo')
    const diagram = buildFlowchart(ast)

    expect(diagram).toContain('flowchart TD')
    expect(diagram).toContain('Inicio: Demo')
    expect(diagram).toContain("Escribir 'Hola'")
    expect(diagram).toContain('Fin')
  })

  it('builds labels for if and while control flow', () => {
    const ast = parseProgram(`Algoritmo Control\nDefinir i Como Entero;\ni <- 0;\nSi i == 0 Entonces\n    Escribir "ok";\nSino\n    Escribir "no";\nFinSi\nMientras i < 2 Hacer\n    i <- i + 1;\nFinMientras\nFinAlgoritmo`)

    const diagram = buildFlowchart(ast)

    expect(diagram).toContain('|Si|')
    expect(diagram).toContain('|No|')
    expect(diagram).toContain('Mientras i < 2?')
    expect(diagram).toContain('Continuar')
  })

  it('sanitizes pipe characters for Mermaid-safe labels', () => {
    const ast = parseProgram('Algoritmo Quotes\nEscribir "A|B";\nFinAlgoritmo')
    const diagram = buildFlowchart(ast)

    expect(diagram).toContain("'A/B'")
    expect(diagram).not.toContain('|B|')
  })

  it('connects loop exits to final end node', () => {
    const ast = parseProgram(`Algoritmo Loop\nDefinir i Como Entero;\nPara i <- 1 Hasta 2 Con Paso 1 Hacer\n    Escribir i;\nFinPara\nFinAlgoritmo`)
    const diagram = buildFlowchart(ast)

    expect(diagram).toContain('|Fin|')
    expect(diagram).toContain('Fin')
  })
})
