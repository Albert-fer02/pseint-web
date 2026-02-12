import type { RuntimeInputField } from '@/entities/pseint/model/types'

export function keepOnlyExpectedInputs(
  currentInputs: Record<string, string>,
  fields: RuntimeInputField[],
  defaultInputs: Record<string, string>,
): Record<string, string> {
  const nextEntries = fields.map((field) => [field.name, currentInputs[field.name] ?? defaultInputs[field.name] ?? ''] as const)
  return Object.fromEntries(nextEntries)
}

export function extractParserErrorLine(parserError: string | null): number | null {
  if (!parserError) {
    return null
  }

  const match = parserError.match(/linea\s+(\d+)/i)
  if (!match) {
    return null
  }

  const line = Number.parseInt(match[1] ?? '', 10)
  return Number.isFinite(line) ? line : null
}

export function isExpectedOutputMatch(runtimeOutput: string[], expectedOutput: string[]): boolean {
  if (runtimeOutput.length !== expectedOutput.length) {
    return false
  }

  for (let index = 0; index < runtimeOutput.length; index += 1) {
    if (runtimeOutput[index]?.trim() !== expectedOutput[index]?.trim()) {
      return false
    }
  }

  return true
}
