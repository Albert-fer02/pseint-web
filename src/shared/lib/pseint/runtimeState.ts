import type {
  Expression,
  ProgramConstant,
  ProgramDeclaration,
  RuntimeValue,
  TargetRef,
} from '@/entities/pseint/model/types'
import { ensureScalar, toArrayIndex } from '@/shared/lib/pseint/runtimePrimitives'
import { PseintRuntimeError } from '@/shared/lib/pseint/runtimeError'
import type { RuntimeContext, RuntimeMetrics } from '@/shared/lib/pseint/runtimeTypes'

export function evaluateConstants(
  constants: ProgramConstant[],
  ctx: RuntimeContext,
  evaluateExpression: (expression: Expression, ctx: RuntimeContext) => RuntimeValue,
): void {
  for (const constant of constants) {
    if (ctx.constants.has(constant.name) || Object.prototype.hasOwnProperty.call(ctx.variables, constant.name)) {
      throw new PseintRuntimeError(`Nombre de constante repetido: ${constant.name}`)
    }

    const rawValue = evaluateExpression(constant.expression, ctx)
    const scalarValue = ensureScalar(rawValue, `constante ${constant.name}`)
    ctx.constants.set(constant.name, scalarValue)
  }
}

export function getDeclarationWithScope(target: string, ctx: RuntimeContext): { declaration: ProgramDeclaration; scope: RuntimeContext } {
  let current: RuntimeContext | null = ctx

  while (current) {
    const declaration = current.declarations.get(target)
    if (declaration) {
      return {
        declaration,
        scope: current,
      }
    }

    current = current.parent
  }

  throw new PseintRuntimeError(`Variable no declarada: ${target}`)
}

export function getVariableValue(name: string, ctx: RuntimeContext): RuntimeValue {
  let current: RuntimeContext | null = ctx

  while (current) {
    if (Object.prototype.hasOwnProperty.call(current.variables, name)) {
      return current.variables[name]
    }

    if (current.constants.has(name)) {
      return current.constants.get(name) as RuntimeValue
    }

    current = current.parent
  }

  throw new PseintRuntimeError(`Variable no declarada: ${name}`)
}

export function hasConstantWithScope(name: string, ctx: RuntimeContext): boolean {
  let current: RuntimeContext | null = ctx

  while (current) {
    if (current.constants.has(name)) {
      return true
    }

    current = current.parent
  }

  return false
}

export function evaluateArrayIndices(
  indexExpressions: Expression[],
  arrayName: string,
  expectedLength: number,
  ctx: RuntimeContext,
  evaluateExpression: (expression: Expression, ctx: RuntimeContext) => RuntimeValue,
): number[] {
  if (indexExpressions.length !== expectedLength) {
    throw new PseintRuntimeError(
      `Cantidad de indices invalida para ${arrayName}: esperado ${expectedLength}, recibido ${indexExpressions.length}.`,
    )
  }

  return indexExpressions.map((indexExpression) => {
    const rawIndex = ensureScalar(evaluateExpression(indexExpression, ctx), `indice de ${arrayName}`)
    return toArrayIndex(rawIndex, arrayName)
  })
}

export function getArrayElement(rawArray: RuntimeValue[], indices: number[], arrayName: string): RuntimeValue {
  let cursor: RuntimeValue = rawArray

  for (const index of indices) {
    if (!Array.isArray(cursor)) {
      throw new PseintRuntimeError(`Acceso invalido al arreglo ${arrayName}.`)
    }

    if (index >= cursor.length) {
      throw new PseintRuntimeError(`Indice fuera de rango en ${arrayName}[${index + 1}].`)
    }

    cursor = cursor[index]
  }

  return cursor
}

export function setArrayElement(rawArray: RuntimeValue[], indices: number[], value: RuntimeValue, arrayName: string): void {
  if (indices.length === 0) {
    throw new PseintRuntimeError(`Indices invalidos para arreglo ${arrayName}.`)
  }

  let cursor: RuntimeValue = rawArray

  for (let index = 0; index < indices.length - 1; index += 1) {
    const position = indices[index]

    if (!Array.isArray(cursor)) {
      throw new PseintRuntimeError(`Acceso invalido al arreglo ${arrayName}.`)
    }

    if (position >= cursor.length) {
      throw new PseintRuntimeError(`Indice fuera de rango en ${arrayName}[${position + 1}].`)
    }

    cursor = cursor[position]
  }

  if (!Array.isArray(cursor)) {
    throw new PseintRuntimeError(`Acceso invalido al arreglo ${arrayName}.`)
  }

  const finalPosition = indices[indices.length - 1]
  if (finalPosition >= cursor.length) {
    throw new PseintRuntimeError(`Indice fuera de rango en ${arrayName}[${finalPosition + 1}].`)
  }

  cursor[finalPosition] = value
}

export function targetToInputKey(
  target: TargetRef,
  ctx: RuntimeContext,
  evaluateExpression: (expression: Expression, ctx: RuntimeContext) => RuntimeValue,
): string {
  if (target.kind === 'variable') {
    return target.name
  }

  const { declaration } = getDeclarationWithScope(target.name, ctx)
  if (declaration.dimensions === null) {
    throw new PseintRuntimeError(`La variable ${target.name} no es un arreglo.`)
  }

  const indices = evaluateArrayIndices(target.indices, target.name, declaration.dimensions.length, ctx, evaluateExpression)
  return `${target.name}[${indices.map((index) => index + 1).join(',')}]`
}

export function getGlobalContext(ctx: RuntimeContext): RuntimeContext {
  let cursor: RuntimeContext = ctx
  while (cursor.parent) {
    cursor = cursor.parent
  }
  return cursor
}

export function buildVisibleOutputs(metrics: RuntimeMetrics): string[] {
  if (metrics.currentLine === null) {
    return [...metrics.outputs]
  }

  return [...metrics.outputs, metrics.currentLine]
}
