import { describe, expect, it } from 'vitest'
import type { BinaryOperator, Expression, ProgramAst, Statement, TargetRef, UnaryOperator } from '../../../entities/pseint/model/types'
import { extractInputFields } from './analyzer'

// Test helpers
function createAst(statements: Statement[]): ProgramAst {
  return {
    name: 'Test',
    declarations: [
      { kind: 'declaration', name: 'nombre', varType: 'Cadena', dimensions: null },
      { kind: 'declaration', name: 'edad', varType: 'Entero', dimensions: null },
      { kind: 'declaration', name: 'altura', varType: 'Real', dimensions: null },
      { kind: 'declaration', name: 'activo', varType: 'Logico', dimensions: null },
      { kind: 'declaration', name: 'inicial', varType: 'Caracter', dimensions: null },
      { kind: 'declaration', name: 'notas', varType: 'Real', dimensions: [5] },
    ],
    constants: [],
    statements,
    functions: [],
    procedures: [],
  }
}

function createReadStatement(target: TargetRef): Statement {
  return { kind: 'read', target }
}

function createVariableTarget(name: string): TargetRef {
  return { kind: 'variable', name }
}

function createArrayElementTarget(name: string, indices: Expression[]): TargetRef {
  return { kind: 'arrayElement', name, indices }
}

function createLiteral(value: number | string | boolean): Expression {
  return { kind: 'literal', value }
}

function createIdentifier(name: string): Expression {
  return { kind: 'identifier', name }
}

function createBinary(left: Expression, operator: BinaryOperator, right: Expression): Expression {
  return { kind: 'binary', left, operator, right }
}

function createUnary(operator: string, operand: Expression): Expression {
  return { kind: 'unary', operator: operator as unknown as UnaryOperator, operand }
}

function createCall(name: string, args: Expression[]): Expression {
  return { kind: 'functionCall', name, args }
}

describe('extractInputFields', () => {
  describe('basic read statements', () => {
    it('extracts single read statement', () => {
      const ast = createAst([
        createReadStatement(createVariableTarget('nombre')),
      ])

      const fields = extractInputFields(ast)

      expect(fields).toEqual([
        { name: 'nombre', varType: 'Cadena' },
      ])
    })

    it('extracts multiple read statements', () => {
      const ast = createAst([
        createReadStatement(createVariableTarget('nombre')),
        createReadStatement(createVariableTarget('edad')),
        createReadStatement(createVariableTarget('altura')),
      ])

      const fields = extractInputFields(ast)

      expect(fields).toEqual([
        { name: 'nombre', varType: 'Cadena' },
        { name: 'edad', varType: 'Entero' },
        { name: 'altura', varType: 'Real' },
      ])
    })

    it('deduplicates repeated read statements', () => {
      const ast = createAst([
        createReadStatement(createVariableTarget('nombre')),
        createReadStatement(createVariableTarget('edad')),
        createReadStatement(createVariableTarget('nombre')),
      ])

      const fields = extractInputFields(ast)

      expect(fields).toEqual([
        { name: 'nombre', varType: 'Cadena' },
        { name: 'edad', varType: 'Entero' },
      ])
    })

    it('defaults to Cadena for undeclared variables', () => {
      const ast = {
        ...createAst([
          createReadStatement(createVariableTarget('undeclared')),
        ]),
        declarations: [],
      }

      const fields = extractInputFields(ast)

      expect(fields).toEqual([
        { name: 'undeclared', varType: 'Cadena' },
      ])
    })

    it('extracts all variable types correctly', () => {
      const ast = createAst([
        createReadStatement(createVariableTarget('nombre')),
        createReadStatement(createVariableTarget('edad')),
        createReadStatement(createVariableTarget('altura')),
        createReadStatement(createVariableTarget('activo')),
        createReadStatement(createVariableTarget('inicial')),
      ])

      const fields = extractInputFields(ast)

      expect(fields).toEqual([
        { name: 'nombre', varType: 'Cadena' },
        { name: 'edad', varType: 'Entero' },
        { name: 'altura', varType: 'Real' },
        { name: 'activo', varType: 'Logico' },
        { name: 'inicial', varType: 'Caracter' },
      ])
    })

    it('returns empty array for no read statements', () => {
      const ast = createAst([])

      const fields = extractInputFields(ast)

      expect(fields).toEqual([])
    })
  })

  describe('array element reads', () => {
    it('extracts array element read with literal index', () => {
      const ast = createAst([
        createReadStatement(createArrayElementTarget('notas', [createLiteral(1)])),
      ])

      const fields = extractInputFields(ast)

      expect(fields).toEqual([
        { name: 'notas[1]', varType: 'Real' },
      ])
    })

    it('extracts array element read with identifier index', () => {
      const ast = createAst([
        createReadStatement(createArrayElementTarget('notas', [createIdentifier('i')])),
      ])

      const fields = extractInputFields(ast)

      expect(fields).toEqual([
        { name: 'notas[i]', varType: 'Real' },
      ])
    })

    it('extracts multidimensional array element', () => {
      const ast = createAst([
        createReadStatement(createArrayElementTarget('matriz', [createLiteral(2), createLiteral(3)])),
      ])

      const fields = extractInputFields(ast)

      expect(fields).toEqual([
        { name: 'matriz[2,3]', varType: 'Cadena' },
      ])
    })

    it('extracts array element with complex expression index', () => {
      const ast = createAst([
        createReadStatement(createArrayElementTarget('notas', [
          createBinary(createIdentifier('i'), '+', createLiteral(1)),
        ])),
      ])

      const fields = extractInputFields(ast)

      expect(fields).toEqual([
        { name: 'notas[i + 1]', varType: 'Real' },
      ])
    })

    it('deduplicates array elements with same indices', () => {
      const ast = createAst([
        createReadStatement(createArrayElementTarget('notas', [createLiteral(1)])),
        createReadStatement(createArrayElementTarget('notas', [createLiteral(1)])),
      ])

      const fields = extractInputFields(ast)

      expect(fields).toHaveLength(1)
      expect(fields[0]?.name).toBe('notas[1]')
    })
  })

  describe('reads in control flow structures', () => {
    it('extracts reads from if-then branch', () => {
      const ast = createAst([{
        kind: 'if',
        condition: createLiteral(true),
        thenBranch: [
          createReadStatement(createVariableTarget('nombre')),
        ],
        elseBranch: [],
      }])

      const fields = extractInputFields(ast)

      expect(fields).toEqual([
        { name: 'nombre', varType: 'Cadena' },
      ])
    })

    it('extracts reads from else branch', () => {
      const ast = createAst([{
        kind: 'if',
        condition: createLiteral(true),
        thenBranch: [],
        elseBranch: [
          createReadStatement(createVariableTarget('edad')),
        ],
      }])

      const fields = extractInputFields(ast)

      expect(fields).toEqual([
        { name: 'edad', varType: 'Entero' },
      ])
    })

    it('extracts reads from both if and else branches', () => {
      const ast = createAst([{
        kind: 'if',
        condition: createLiteral(true),
        thenBranch: [
          createReadStatement(createVariableTarget('nombre')),
        ],
        elseBranch: [
          createReadStatement(createVariableTarget('edad')),
        ],
      }])

      const fields = extractInputFields(ast)

      expect(fields).toEqual([
        { name: 'nombre', varType: 'Cadena' },
        { name: 'edad', varType: 'Entero' },
      ])
    })

    it('extracts reads from nested if blocks', () => {
      const ast = createAst([{
        kind: 'if',
        condition: createLiteral(true),
        thenBranch: [{
          kind: 'if',
          condition: createLiteral(true),
          thenBranch: [
            createReadStatement(createVariableTarget('nombre')),
          ],
          elseBranch: [],
        }],
        elseBranch: [],
      }])

      const fields = extractInputFields(ast)

      expect(fields).toEqual([
        { name: 'nombre', varType: 'Cadena' },
      ])
    })
  })

  describe('reads in loops', () => {
    it('extracts reads from for loop body', () => {
      const ast = createAst([{
        kind: 'for',
        iterator: 'i',
        start: createLiteral(1),
        end: createLiteral(10),
        step: createLiteral(1),
        body: [
          createReadStatement(createVariableTarget('nombre')),
        ],
      }])

      const fields = extractInputFields(ast)

      expect(fields).toEqual([
        { name: 'nombre', varType: 'Cadena' },
      ])
    })

    it('extracts reads from while loop body', () => {
      const ast = createAst([{
        kind: 'while',
        condition: createLiteral(true),
        body: [
          createReadStatement(createVariableTarget('edad')),
        ],
      }])

      const fields = extractInputFields(ast)

      expect(fields).toEqual([
        { name: 'edad', varType: 'Entero' },
      ])
    })

    it('extracts reads from repeat-until loop body', () => {
      const ast = createAst([{
        kind: 'repeatUntil',
        body: [
          createReadStatement(createVariableTarget('altura')),
        ],
        condition: createLiteral(false),
      }])

      const fields = extractInputFields(ast)

      expect(fields).toEqual([
        { name: 'altura', varType: 'Real' },
      ])
    })

    it('extracts reads from nested loops', () => {
      const ast = createAst([{
        kind: 'for',
        iterator: 'i',
        start: createLiteral(1),
        end: createLiteral(3),
        step: createLiteral(1),
        body: [{
          kind: 'for',
          iterator: 'j',
          start: createLiteral(1),
          end: createLiteral(3),
          step: createLiteral(1),
          body: [
            createReadStatement(createVariableTarget('nombre')),
          ],
        }],
      }])

      const fields = extractInputFields(ast)

      expect(fields).toEqual([
        { name: 'nombre', varType: 'Cadena' },
      ])
    })
  })

  describe('reads in switch statements', () => {
    it('extracts reads from switch cases', () => {
      const ast = createAst([{
        kind: 'switch',
        expression: createIdentifier('x'),
        cases: [
          {
            values: [createLiteral(1)],
            body: [
              createReadStatement(createVariableTarget('nombre')),
            ],
          },
          {
            values: [createLiteral(2)],
            body: [
              createReadStatement(createVariableTarget('edad')),
            ],
          },
        ],
        defaultBranch: [],
      }])

      const fields = extractInputFields(ast)

      expect(fields).toEqual([
        { name: 'nombre', varType: 'Cadena' },
        { name: 'edad', varType: 'Entero' },
      ])
    })

    it('extracts reads from switch default branch', () => {
      const ast = createAst([{
        kind: 'switch',
        expression: createIdentifier('x'),
        cases: [],
        defaultBranch: [
          createReadStatement(createVariableTarget('altura')),
        ],
      }])

      const fields = extractInputFields(ast)

      expect(fields).toEqual([
        { name: 'altura', varType: 'Real' },
      ])
    })

    it('extracts reads from both cases and default', () => {
      const ast = createAst([{
        kind: 'switch',
        expression: createIdentifier('x'),
        cases: [
          {
            values: [createLiteral(1)],
            body: [
              createReadStatement(createVariableTarget('nombre')),
            ],
          },
        ],
        defaultBranch: [
          createReadStatement(createVariableTarget('edad')),
        ],
      }])

      const fields = extractInputFields(ast)

      expect(fields).toEqual([
        { name: 'nombre', varType: 'Cadena' },
        { name: 'edad', varType: 'Entero' },
      ])
    })
  })

  describe('expression to string conversion', () => {
    it('converts unary expression to string', () => {
      const ast = createAst([
        createReadStatement(createArrayElementTarget('notas', [
          createUnary('-', createIdentifier('i')),
        ])),
      ])

      const fields = extractInputFields(ast)

      expect(fields[0]?.name).toBe('notas[- i]')
    })

    it('converts binary expression to string', () => {
      const ast = createAst([
        createReadStatement(createArrayElementTarget('notas', [
          createBinary(createIdentifier('i'), '*', createLiteral(2)),
        ])),
      ])

      const fields = extractInputFields(ast)

      expect(fields[0]?.name).toBe('notas[i * 2]')
    })

    it('converts nested binary expression to string', () => {
      const ast = createAst([
        createReadStatement(createArrayElementTarget('notas', [
          createBinary(
            createBinary(createIdentifier('i'), '+', createLiteral(1)),
            '*',
            createLiteral(2),
          ),
        ])),
      ])

      const fields = extractInputFields(ast)

      expect(fields[0]?.name).toBe('notas[i + 1 * 2]')
    })

    it('converts call expression to string', () => {
      const ast = createAst([
        createReadStatement(createArrayElementTarget('notas', [
          createCall('calcular', [createLiteral(5), createIdentifier('x')]),
        ])),
      ])

      const fields = extractInputFields(ast)

      expect(fields[0]?.name).toBe('notas[calcular(5, x)]')
    })

    it('converts nested array element to string', () => {
      const nestedArrayElement: Expression = {
        kind: 'arrayElement',
        name: 'matriz',
        indices: [createIdentifier('i'), createIdentifier('j')],
      }

      const ast = createAst([
        createReadStatement(createArrayElementTarget('otro', [nestedArrayElement])),
      ])

      const fields = extractInputFields(ast)

      expect(fields[0]?.name).toBe('otro[matriz[i,j]]')
    })
  })

  describe('complex real-world scenarios', () => {
    it('extracts reads from complex nested program', () => {
      const ast = createAst([
        createReadStatement(createVariableTarget('nombre')),
        {
          kind: 'for',
          iterator: 'i',
          start: createLiteral(1),
          end: createLiteral(5),
          step: createLiteral(1),
          body: [
            createReadStatement(createArrayElementTarget('notas', [createIdentifier('i')])),
            {
              kind: 'if',
              condition: createBinary(createIdentifier('i'), '>', createLiteral(3)),
              thenBranch: [
                createReadStatement(createVariableTarget('edad')),
              ],
              elseBranch: [],
            },
          ],
        },
        {
          kind: 'switch',
          expression: createIdentifier('opcion'),
          cases: [
            {
              values: [createLiteral(1)],
              body: [
                createReadStatement(createVariableTarget('altura')),
              ],
            },
          ],
          defaultBranch: [
            createReadStatement(createVariableTarget('activo')),
          ],
        },
      ])

      const fields = extractInputFields(ast)

      expect(fields).toEqual([
        { name: 'nombre', varType: 'Cadena' },
        { name: 'notas[i]', varType: 'Real' },
        { name: 'edad', varType: 'Entero' },
        { name: 'altura', varType: 'Real' },
        { name: 'activo', varType: 'Logico' },
      ])
    })

    it('maintains order of first occurrence', () => {
      const ast = createAst([
        createReadStatement(createVariableTarget('edad')),
        createReadStatement(createVariableTarget('nombre')),
        createReadStatement(createVariableTarget('altura')),
        createReadStatement(createVariableTarget('edad')),
      ])

      const fields = extractInputFields(ast)

      expect(fields.map(f => f.name)).toEqual(['edad', 'nombre', 'altura'])
    })
  })
})
