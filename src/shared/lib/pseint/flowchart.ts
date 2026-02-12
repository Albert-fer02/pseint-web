import type { Expression, ProgramAst, Statement, TargetRef } from '@/entities/pseint/model/types'

interface MermaidBuilder {
  lines: string[]
  nodeCount: number
}

export function buildFlowchart(ast: ProgramAst): string {
  const builder: MermaidBuilder = {
    lines: ['flowchart TD'],
    nodeCount: 0,
  }

  const startNode = createNode(builder, `Inicio: ${ast.name}`)
  const exits = buildStatementSequence(builder, ast.statements, [startNode])
  const endNode = createNode(builder, 'Fin')

  for (const exitNode of exits) {
    connect(builder, exitNode, endNode)
  }

  return builder.lines.join('\n')
}

function buildStatementSequence(builder: MermaidBuilder, statements: Statement[], incomingNodes: string[]): string[] {
  let currentIncoming = [...incomingNodes]

  for (const statement of statements) {
    if (statement.kind === 'if') {
      const decisionNode = createNode(builder, `Si ${expressionToString(statement.condition)}?`)
      for (const incoming of currentIncoming) {
        connect(builder, incoming, decisionNode)
      }

      const mergeNode = createNode(builder, 'Continuar')

      if (statement.thenBranch.length === 0) {
        connect(builder, decisionNode, mergeNode, 'Si')
      } else {
        const thenExits = buildStatementSequence(builder, statement.thenBranch, [decisionNode])
        if (thenExits[0]) {
          labelLastConnection(builder, decisionNode, thenExits[0], 'Si')
        }
        for (const exit of thenExits) {
          connect(builder, exit, mergeNode)
        }
      }

      if (statement.elseBranch.length === 0) {
        connect(builder, decisionNode, mergeNode, 'No')
      } else {
        const elseExits = buildStatementSequence(builder, statement.elseBranch, [decisionNode])
        if (elseExits[0]) {
          labelLastConnection(builder, decisionNode, elseExits[0], 'No')
        }
        for (const exit of elseExits) {
          connect(builder, exit, mergeNode)
        }
      }

      currentIncoming = [mergeNode]
      continue
    }

    if (statement.kind === 'for') {
      const loopNode = createNode(
        builder,
        `Para ${statement.iterator} <- ${expressionToString(statement.start)} Hasta ${expressionToString(statement.end)} Paso ${expressionToString(statement.step)}`,
      )
      for (const incoming of currentIncoming) {
        connect(builder, incoming, loopNode)
      }

      const entryNode = createNode(builder, `Iterar ${statement.iterator}`)
      connect(builder, loopNode, entryNode, 'Iterar')

      if (statement.body.length === 0) {
        connect(builder, entryNode, loopNode, 'Siguiente')
      } else {
        const bodyExits = buildStatementSequence(builder, statement.body, [entryNode])
        for (const exit of bodyExits) {
          connect(builder, exit, loopNode, 'Siguiente')
        }
      }

      const afterLoopNode = createNode(builder, 'Continuar')
      connect(builder, loopNode, afterLoopNode, 'Fin')
      currentIncoming = [afterLoopNode]
      continue
    }

    if (statement.kind === 'while') {
      const conditionNode = createNode(builder, `Mientras ${expressionToString(statement.condition)}?`)
      for (const incoming of currentIncoming) {
        connect(builder, incoming, conditionNode)
      }

      const afterLoopNode = createNode(builder, 'Continuar')
      connect(builder, conditionNode, afterLoopNode, 'No')

      const bodyEntryNode = createNode(builder, 'Cuerpo Mientras')
      connect(builder, conditionNode, bodyEntryNode, 'Si')

      if (statement.body.length === 0) {
        connect(builder, bodyEntryNode, conditionNode)
      } else {
        const bodyExits = buildStatementSequence(builder, statement.body, [bodyEntryNode])
        for (const exit of bodyExits) {
          connect(builder, exit, conditionNode)
        }
      }

      currentIncoming = [afterLoopNode]
      continue
    }

    if (statement.kind === 'repeatUntil') {
      const repeatNode = createNode(builder, 'Repetir')
      for (const incoming of currentIncoming) {
        connect(builder, incoming, repeatNode)
      }

      let bodyExits: string[] = [repeatNode]
      if (statement.body.length > 0) {
        bodyExits = buildStatementSequence(builder, statement.body, [repeatNode])
      }

      const untilNode = createNode(builder, `Hasta Que ${expressionToString(statement.condition)}?`)
      for (const exit of bodyExits) {
        connect(builder, exit, untilNode)
      }

      connect(builder, untilNode, repeatNode, 'No')
      const afterLoopNode = createNode(builder, 'Continuar')
      connect(builder, untilNode, afterLoopNode, 'Si')
      currentIncoming = [afterLoopNode]
      continue
    }

    if (statement.kind === 'switch') {
      const switchNode = createNode(builder, `Segun ${expressionToString(statement.expression)}`)
      for (const incoming of currentIncoming) {
        connect(builder, incoming, switchNode)
      }

      const mergeNode = createNode(builder, 'Continuar')

      for (const caseBranch of statement.cases) {
        const caseNode = createNode(
          builder,
          `Caso ${caseBranch.values.map((value) => expressionToString(value)).join(', ')}`,
        )
        connect(builder, switchNode, caseNode)

        if (caseBranch.body.length === 0) {
          connect(builder, caseNode, mergeNode)
        } else {
          const caseExits = buildStatementSequence(builder, caseBranch.body, [caseNode])
          for (const exit of caseExits) {
            connect(builder, exit, mergeNode)
          }
        }
      }

      if (statement.defaultBranch.length === 0) {
        connect(builder, switchNode, mergeNode, 'Otro')
      } else {
        const defaultNode = createNode(builder, 'De Otro Modo')
        connect(builder, switchNode, defaultNode, 'Otro')
        const defaultExits = buildStatementSequence(builder, statement.defaultBranch, [defaultNode])
        for (const exit of defaultExits) {
          connect(builder, exit, mergeNode)
        }
      }

      currentIncoming = [mergeNode]
      continue
    }

    const nodeLabel = statementToLabel(statement)
    const statementNode = createNode(builder, nodeLabel)
    for (const incoming of currentIncoming) {
      connect(builder, incoming, statementNode)
    }
    currentIncoming = [statementNode]
  }

  return currentIncoming
}

function statementToLabel(
  statement: Exclude<
    Statement,
    { kind: 'if' } | { kind: 'for' } | { kind: 'while' } | { kind: 'repeatUntil' } | { kind: 'switch' }
  >,
): string {
  if (statement.kind === 'read') {
    return `Leer ${targetToString(statement.target)}`
  }

  if (statement.kind === 'assign') {
    return `${targetToString(statement.target)} <- ${expressionToString(statement.expression)}`
  }

  if (statement.kind === 'call') {
    return `${statement.name}(${statement.args.map((expression) => expressionToString(expression)).join(', ')})`
  }

  const writeTail = statement.noNewline ? ' Sin Saltar' : ''
  return `Escribir ${statement.expressions.map((expression) => expressionToString(expression)).join(', ')}${writeTail}`
}

function expressionToString(expression: Expression): string {
  if (expression.kind === 'literal') {
    return typeof expression.value === 'string' ? `"${expression.value}"` : String(expression.value)
  }
  if (expression.kind === 'identifier') {
    return expression.name
  }
  if (expression.kind === 'arrayElement') {
    return `${expression.name}[${expression.indices.map((index) => expressionToString(index)).join(', ')}]`
  }
  if (expression.kind === 'unary') {
    return `${expression.operator} ${expressionToString(expression.operand)}`
  }
  if (expression.kind === 'binary') {
    return `${expressionToString(expression.left)} ${expression.operator} ${expressionToString(expression.right)}`
  }
  return `${expression.name}(${expression.args.map((arg) => expressionToString(arg)).join(', ')})`
}

function targetToString(target: TargetRef): string {
  if (target.kind === 'variable') {
    return target.name
  }

  return `${target.name}[${target.indices.map((index) => expressionToString(index)).join(', ')}]`
}

function createNode(builder: MermaidBuilder, label: string): string {
  builder.nodeCount += 1
  const id = `n${builder.nodeCount}`
  const safeLabel = sanitizeLabel(label)
  builder.lines.push(`  ${id}["${safeLabel}"]`)
  return id
}

function connect(builder: MermaidBuilder, from: string, to: string, label?: string): void {
  if (label) {
    builder.lines.push(`  ${from} -->|${sanitizeLabel(label)}| ${to}`)
    return
  }
  builder.lines.push(`  ${from} --> ${to}`)
}

function labelLastConnection(builder: MermaidBuilder, from: string, to: string, label: string): void {
  for (let i = builder.lines.length - 1; i >= 0; i -= 1) {
    const raw = builder.lines[i]
    const normalized = raw.trim()
    const expected = `${from} --> ${to}`
    if (normalized === expected) {
      builder.lines[i] = `  ${from} -->|${sanitizeLabel(label)}| ${to}`
      return
    }
  }
}

function sanitizeLabel(label: string): string {
  return label.replace(/"/g, "'").replace(/\|/g, '/')
}
