import type { RuntimeExecution, RuntimeValue } from '@/entities/pseint/model/types'

export function formatTraceMarker(marker: RuntimeExecution['trace'][number]['marker'] | undefined): string {
  if (!marker) {
    return 'Sin traza'
  }

  if (marker === 'start') {
    return 'Inicio'
  }

  if (marker === 'finish') {
    return 'Fin'
  }

  if (marker === 'read') {
    return 'Sentencia: Leer'
  }
  if (marker === 'write') {
    return 'Sentencia: Escribir'
  }
  if (marker === 'assign') {
    return 'Sentencia: Asignacion'
  }
  if (marker === 'call') {
    return 'Sentencia: Llamada'
  }
  if (marker === 'if') {
    return 'Sentencia: Si'
  }
  if (marker === 'for') {
    return 'Sentencia: Para'
  }
  if (marker === 'while') {
    return 'Sentencia: Mientras'
  }
  if (marker === 'repeatUntil') {
    return 'Sentencia: Repetir'
  }

  return 'Sentencia: Segun'
}

export function formatRuntimeValue(value: RuntimeValue): string {
  if (typeof value === 'string') {
    return `"${value}"`
  }

  if (typeof value === 'boolean') {
    return value ? 'Verdadero' : 'Falso'
  }

  if (typeof value === 'number') {
    return String(value)
  }

  return JSON.stringify(value, null, 2)
}

export function getChangedVariableNames(
  previousVariables: Record<string, RuntimeValue> | null,
  currentVariables: Record<string, RuntimeValue> | null,
): Set<string> {
  if (!previousVariables || !currentVariables) {
    return new Set()
  }

  const changed = new Set<string>()
  for (const [name, currentValue] of Object.entries(currentVariables)) {
    const previousValue = previousVariables[name]
    if (previousValue === undefined || !runtimeValuesEqual(previousValue, currentValue)) {
      changed.add(name)
    }
  }

  return changed
}

function runtimeValuesEqual(left: RuntimeValue, right: RuntimeValue): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}
