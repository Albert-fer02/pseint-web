import type { BinaryOperator } from '../../../entities/pseint/model/types'

export function findOperatorRightToLeft(
  value: string,
  operators: BinaryOperator[],
): { index: number; operator: BinaryOperator } | null {
  let parenDepth = 0
  let bracketDepth = 0
  let inString = false

  for (let i = value.length - 1; i >= 0; i -= 1) {
    const char = value[i]

    if (char === '"') {
      inString = !inString
      continue
    }
    if (inString) {
      continue
    }

    if (char === ')') {
      parenDepth += 1
      continue
    }
    if (char === '(') {
      parenDepth -= 1
      continue
    }
    if (char === ']') {
      bracketDepth += 1
      continue
    }
    if (char === '[') {
      bracketDepth -= 1
      continue
    }
    if (parenDepth !== 0 || bracketDepth !== 0) {
      continue
    }

    for (const operator of operators) {
      const startIndex = i - operator.length + 1
      if (startIndex < 0) {
        continue
      }

      const token = value.slice(startIndex, i + 1)
      const normalizedToken = token.toUpperCase()
      const normalizedOperator = operator.toUpperCase()
      if (normalizedToken !== normalizedOperator) {
        continue
      }

      if ((operator === 'Y' || operator === 'O')) {
        const before = startIndex > 0 ? value[startIndex - 1] : ''
        const after = i + 1 < value.length ? value[i + 1] : ''
        if (isWordChar(before) || isWordChar(after)) {
          continue
        }
      }

      return { index: startIndex, operator }
    }
  }

  return null
}

function isWordChar(value: string): boolean {
  return /^[A-Za-z0-9_]$/.test(value)
}

export function splitTopLevel(input: string, delimiter: ',' | ';'): string[] {
  const values: string[] = []
  let start = 0
  let parenDepth = 0
  let bracketDepth = 0
  let inString = false

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i]

    if (char === '"') {
      inString = !inString
      continue
    }
    if (inString) {
      continue
    }

    if (char === '(') {
      parenDepth += 1
      continue
    }
    if (char === ')') {
      parenDepth -= 1
      continue
    }
    if (char === '[') {
      bracketDepth += 1
      continue
    }
    if (char === ']') {
      bracketDepth -= 1
      continue
    }

    if (parenDepth === 0 && bracketDepth === 0 && char === delimiter) {
      values.push(input.slice(start, i).trim())
      start = i + 1
    }
  }

  values.push(input.slice(start).trim())
  return values.filter(Boolean)
}

export function stripOuterParentheses(value: string): string {
  let text = value.trim()
  while (text.startsWith('(') && text.endsWith(')') && isFullyWrapped(text)) {
    text = text.slice(1, -1).trim()
  }
  return text
}

function isFullyWrapped(value: string): boolean {
  let depth = 0
  let inString = false

  for (let i = 0; i < value.length; i += 1) {
    const char = value[i]
    if (char === '"') {
      inString = !inString
      continue
    }
    if (inString) {
      continue
    }

    if (char === '(') {
      depth += 1
    } else if (char === ')') {
      depth -= 1
      if (depth === 0 && i < value.length - 1) {
        return false
      }
    }
  }

  return depth === 0
}

export function isQuoted(value: string): boolean {
  return value.startsWith('"') && value.endsWith('"')
}

export function unquote(value: string): string {
  return value.slice(1, -1)
}
