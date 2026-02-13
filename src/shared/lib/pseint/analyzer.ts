import type { Expression, ProgramAst, RuntimeInputField, Statement, TargetRef } from '../../../entities/pseint/model/types'

export function extractInputFields(ast: ProgramAst): RuntimeInputField[] {
  const declarationMap = new Map(ast.declarations.map((declaration) => [declaration.name, declaration.varType]))
  const seen = new Set<string>()
  const fields: RuntimeInputField[] = []

  collectReadStatements(ast.statements, seen, declarationMap, fields)

  return fields
}

function collectReadStatements(
  statements: Statement[],
  seen: Set<string>,
  declarationMap: Map<string, RuntimeInputField['varType']>,
  fields: RuntimeInputField[],
): void {
  for (const statement of statements) {
    if (statement.kind === 'read') {
      const targetName = targetRefToInputName(statement.target)
      if (seen.has(targetName)) {
        continue
      }

      seen.add(targetName)
      fields.push({
        name: targetName,
        varType: declarationMap.get(statement.target.name) ?? 'Cadena',
      })
      continue
    }

    if (statement.kind === 'if') {
      collectReadStatements(statement.thenBranch, seen, declarationMap, fields)
      collectReadStatements(statement.elseBranch, seen, declarationMap, fields)
      continue
    }

    if (statement.kind === 'for') {
      collectReadStatements(statement.body, seen, declarationMap, fields)
      continue
    }

    if (statement.kind === 'while') {
      collectReadStatements(statement.body, seen, declarationMap, fields)
      continue
    }

    if (statement.kind === 'repeatUntil') {
      collectReadStatements(statement.body, seen, declarationMap, fields)
      continue
    }

    if (statement.kind === 'switch') {
      for (const caseBranch of statement.cases) {
        collectReadStatements(caseBranch.body, seen, declarationMap, fields)
      }
      collectReadStatements(statement.defaultBranch, seen, declarationMap, fields)
    }
  }
}

function targetRefToInputName(target: TargetRef): string {
  if (target.kind === 'variable') {
    return target.name
  }

  return `${target.name}[${target.indices.map((index) => expressionToCompactString(index)).join(',')}]`
}

function expressionToCompactString(expression: Expression): string {
  if (expression.kind === 'literal') {
    return String(expression.value)
  }

  if (expression.kind === 'identifier') {
    return expression.name
  }

  if (expression.kind === 'arrayElement') {
    return `${expression.name}[${expression.indices.map((index) => expressionToCompactString(index)).join(',')}]`
  }

  if (expression.kind === 'unary') {
    return `${expression.operator} ${expressionToCompactString(expression.operand)}`
  }

  if (expression.kind === 'binary') {
    return `${expressionToCompactString(expression.left)} ${expression.operator} ${expressionToCompactString(expression.right)}`
  }

  return `${expression.name}(${expression.args.map((arg) => expressionToCompactString(arg)).join(', ')})`
}
