import type { Expression, TargetRef } from '@/entities/pseint/model/types'
import {
  OPERATOR_LEVELS,
  PseintParseError,
  SWITCH_CASE_REGEX,
} from '@/shared/lib/pseint/parserCore'
import {
  findOperatorRightToLeft,
  isQuoted,
  splitTopLevel,
  stripOuterParentheses,
  unquote,
} from '@/shared/lib/pseint/parserUtils'

export function parseExpression(raw: string, line: number): Expression {
  const value = stripOuterParentheses(raw.trim())

  if (isQuoted(value)) {
    return { kind: 'literal', value: unquote(value) }
  }

  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return { kind: 'literal', value: Number(value) }
  }

  if (/^(Verdadero|Falso)$/i.test(value)) {
    return { kind: 'literal', value: /^Verdadero$/i.test(value) }
  }

  const notMatch = value.match(/^No\s+(.+)$/i)
  if (notMatch?.[1]) {
    return {
      kind: 'unary',
      operator: 'NO',
      operand: parseExpression(notMatch[1], line),
    }
  }

  for (const operators of OPERATOR_LEVELS) {
    const operatorIndex = findOperatorRightToLeft(value, operators)
    if (!operatorIndex) {
      continue
    }

    const leftRaw = value.slice(0, operatorIndex.index)
    const rightRaw = value.slice(operatorIndex.index + operatorIndex.operator.length)

    if (!leftRaw.trim() || !rightRaw.trim()) {
      throw new PseintParseError('Expresion binaria incompleta.', line)
    }

    return {
      kind: 'binary',
      operator: operatorIndex.operator,
      left: parseExpression(leftRaw, line),
      right: parseExpression(rightRaw, line),
    }
  }

  const fnMatch = value.match(/^([A-Za-z_][A-Za-z0-9_]*)\((.*)\)$/)
  if (fnMatch?.[1]) {
    const rawArgs = (fnMatch[2] ?? '').trim()
    const args = rawArgs ? splitTopLevel(rawArgs, ',').map((arg) => parseExpression(arg, line)) : []

    return {
      kind: 'functionCall',
      name: fnMatch[1],
      args,
    }
  }

  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    return {
      kind: 'identifier',
      name: value,
    }
  }

  const arrayAccessMatch = value.match(/^([A-Za-z_][A-Za-z0-9_]*)\[(.+)\]$/)
  if (arrayAccessMatch?.[1] && arrayAccessMatch[2]) {
    const rawIndices = splitTopLevel(arrayAccessMatch[2], ',')
    if (!rawIndices.length) {
      throw new PseintParseError(`Acceso invalido a arreglo: "${value}"`, line)
    }

    return {
      kind: 'arrayElement',
      name: arrayAccessMatch[1],
      indices: rawIndices.map((rawIndex) => parseExpression(rawIndex, line)),
    }
  }

  throw new PseintParseError(`Expresion no reconocida: "${value}"`, line)
}

export function parseTargetRef(rawTarget: string, line: number): TargetRef {
  const target = rawTarget.trim()

  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(target)) {
    return { kind: 'variable', name: target }
  }

  const arrayAccessMatch = target.match(/^([A-Za-z_][A-Za-z0-9_]*)\[(.+)\]$/)
  if (arrayAccessMatch?.[1] && arrayAccessMatch[2]) {
    const rawIndices = splitTopLevel(arrayAccessMatch[2], ',')
    if (!rawIndices.length) {
      throw new PseintParseError(`Referencia de arreglo invalida: "${rawTarget}"`, line)
    }

    return {
      kind: 'arrayElement',
      name: arrayAccessMatch[1],
      indices: rawIndices.map((rawIndex) => parseExpression(rawIndex, line)),
    }
  }

  throw new PseintParseError(`Referencia de variable invalida: "${rawTarget}"`, line)
}

export function parseSegunCaseValues(rawCaseLine: string, line: number): Expression[] {
  const match = rawCaseLine.match(SWITCH_CASE_REGEX)
  if (!match?.[1]) {
    throw new PseintParseError(`Caso invalido en Segun: "${rawCaseLine}"`, line)
  }

  const rawValues = splitTopLevel(match[1], ',')
  if (!rawValues.length) {
    throw new PseintParseError('Un caso de Segun debe tener al menos un valor.', line)
  }

  return rawValues.map((rawValue) => parseExpression(rawValue, line))
}
