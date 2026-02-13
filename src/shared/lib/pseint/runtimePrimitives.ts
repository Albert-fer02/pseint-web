import type { ProgramDeclaration, PseintVarType, RuntimeScalar, RuntimeValue } from '../../../entities/pseint/model/types'
import { PseintRuntimeError } from './runtimeError'

const MAX_LOOP_ITERATIONS = 100_000

export function inferArrayDimensions(value: RuntimeValue): number[] {
  if (!Array.isArray(value)) {
    return []
  }

  const currentSize = value.length
  if (currentSize === 0) {
    return [0]
  }

  const firstChildDimensions = inferArrayDimensions(value[0])
  return [currentSize, ...firstChildDimensions]
}

export function ensureArrayShapeMatchesDeclaration(value: RuntimeValue, expectedDimensions: number[], variableName: string): void {
  if (!Array.isArray(value)) {
    throw new PseintRuntimeError(`Se esperaba arreglo en ${variableName}.`)
  }

  const receivedDimensions = inferArrayDimensions(value)
  if (receivedDimensions.length !== expectedDimensions.length) {
    throw new PseintRuntimeError(
      `Dimensiones invalidas en ${variableName}: esperado ${expectedDimensions.length}, recibido ${receivedDimensions.length}.`,
    )
  }

  for (let index = 0; index < expectedDimensions.length; index += 1) {
    const expected = expectedDimensions[index]
    const received = receivedDimensions[index]

    if (expected !== received) {
      throw new PseintRuntimeError(`Tamano invalido en ${variableName}: esperado ${expected}, recibido ${received}.`)
    }
  }
}

export function inferScalarTypeFromValue(value: RuntimeValue): PseintVarType {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return 'Real'
    }

    return inferScalarTypeFromValue(value[0])
  }

  if (typeof value === 'boolean') {
    return 'Logico'
  }

  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'Entero' : 'Real'
  }

  return 'Cadena'
}

export function defaultValueByDeclaration(declaration: ProgramDeclaration): RuntimeValue {
  const scalarDefault = defaultValueByType(declaration.varType)

  if (declaration.dimensions === null) {
    return scalarDefault
  }

  if (declaration.dimensions.some((dimension) => dimension <= 0)) {
    throw new PseintRuntimeError(`El arreglo ${declaration.name} debe tener dimensiones mayores a 0.`)
  }

  return createArrayByDimensions(declaration.dimensions, scalarDefault)
}

function createArrayByDimensions(dimensions: number[], scalarDefault: RuntimeScalar): RuntimeValue[] {
  const [current, ...rest] = dimensions
  if (rest.length === 0) {
    return Array.from({ length: current }, () => scalarDefault)
  }

  return Array.from({ length: current }, () => createArrayByDimensions(rest, scalarDefault))
}

function defaultValueByType(type: PseintVarType): RuntimeScalar {
  switch (type) {
    case 'Cadena':
      return ''
    case 'Caracter':
      return ''
    case 'Entero':
      return 0
    case 'Real':
      return 0
    case 'Logico':
      return false
    default: {
      const neverType: never = type
      throw new PseintRuntimeError(`Tipo no soportado: ${neverType}`)
    }
  }
}

export function coerceToType(value: RuntimeScalar, type: PseintVarType, variableName: string): RuntimeScalar {
  switch (type) {
    case 'Cadena':
      return stringifyValue(value)
    case 'Caracter': {
      const stringValue = stringifyValue(value)
      if (!stringValue.length) {
        throw new PseintRuntimeError(`La variable ${variableName} requiere al menos un caracter.`)
      }
      return stringValue[0]
    }
    case 'Entero': {
      const numeric = typeof value === 'number' ? value : Number.parseInt(stringifyValue(value), 10)
      if (!Number.isFinite(numeric)) {
        throw new PseintRuntimeError(`La variable ${variableName} requiere un Entero.`)
      }
      return Math.trunc(numeric)
    }
    case 'Real': {
      const numeric = typeof value === 'number' ? value : Number(stringifyValue(value))
      if (!Number.isFinite(numeric)) {
        throw new PseintRuntimeError(`La variable ${variableName} requiere un Real.`)
      }
      return numeric
    }
    case 'Logico': {
      if (typeof value === 'boolean') {
        return value
      }
      const normalized = stringifyValue(value).trim().toLowerCase()
      if (['verdadero', 'true', '1'].includes(normalized)) {
        return true
      }
      if (['falso', 'false', '0'].includes(normalized)) {
        return false
      }
      throw new PseintRuntimeError(`La variable ${variableName} requiere un Logico.`)
    }
    default: {
      const neverType: never = type
      throw new PseintRuntimeError(`Tipo no soportado: ${neverType}`)
    }
  }
}

export function ensureNumericType(type: PseintVarType, variableName: string): void {
  if (type !== 'Entero' && type !== 'Real') {
    throw new PseintRuntimeError(`El iterador ${variableName} en Para debe ser Entero o Real.`)
  }
}

export function ensureLoopLimit(iterations: number, loopName: string): void {
  if (iterations > MAX_LOOP_ITERATIONS) {
    throw new PseintRuntimeError(`Se supero el limite de iteraciones del ciclo ${loopName}.`)
  }
}

export function ensureScalar(value: RuntimeValue, context: string): RuntimeScalar {
  if (Array.isArray(value)) {
    throw new PseintRuntimeError(`Se esperaba un valor escalar en ${context}.`)
  }
  return value
}

export function toFiniteNumber(value: RuntimeScalar, context: string): number {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) {
    throw new PseintRuntimeError(`Se esperaba un numero en ${context}.`)
  }
  return numeric
}

export function toArrayIndex(value: RuntimeScalar, arrayName: string): number {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) {
    throw new PseintRuntimeError(`Indice no numerico en arreglo ${arrayName}.`)
  }

  const integerIndex = Math.trunc(numeric)
  if (integerIndex < 1) {
    throw new PseintRuntimeError(`Indice fuera de rango en ${arrayName}[${integerIndex}].`)
  }

  return integerIndex - 1
}

export function toBoolean(value: RuntimeScalar): boolean {
  if (typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'number') {
    return value !== 0
  }
  const normalized = value.trim().toLowerCase()
  return normalized !== '' && normalized !== 'false' && normalized !== 'falso' && normalized !== '0'
}

export function valuesEqual(left: RuntimeScalar, right: RuntimeScalar): boolean {
  if (typeof left === 'boolean' || typeof right === 'boolean') {
    return toBoolean(left) === toBoolean(right)
  }

  if (typeof left === 'number' || typeof right === 'number') {
    const leftNumber = Number(left)
    const rightNumber = Number(right)
    if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
      return leftNumber === rightNumber
    }
  }

  return stringifyValue(left) === stringifyValue(right)
}

export function stringifyValue(value: RuntimeValue): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stringifyValue(item)).join(', ')}]`
  }

  if (typeof value === 'boolean') {
    return value ? 'Verdadero' : 'Falso'
  }
  return String(value)
}

export function cloneRuntimeValue(value: RuntimeValue): RuntimeValue {
  if (!Array.isArray(value)) {
    return value
  }

  return value.map((item) => cloneRuntimeValue(item))
}

export function cloneVariables(variables: Record<string, RuntimeValue>): Record<string, RuntimeValue> {
  const clonedEntries = Object.entries(variables).map(([name, value]) => [name, cloneRuntimeValue(value)] as const)
  return Object.fromEntries(clonedEntries)
}
