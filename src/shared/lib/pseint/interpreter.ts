import type {
  Expression,
  ProgramAst,
  RuntimeExecution,
  RuntimeStepSnapshot,
  RuntimeScalar,
  RuntimeValue,
  Statement,
  TargetRef,
} from '@/entities/pseint/model/types'
import { PseintRuntimeError } from '@/shared/lib/pseint/runtimeError'
import {
  cloneVariables,
  coerceToType,
  defaultValueByDeclaration,
  ensureLoopLimit,
  ensureNumericType,
  ensureScalar,
  stringifyValue,
  toBoolean,
  toFiniteNumber,
  valuesEqual,
} from '@/shared/lib/pseint/runtimePrimitives'
import {
  buildVisibleOutputs,
  evaluateArrayIndices,
  evaluateConstants,
  getArrayElement,
  getDeclarationWithScope,
  getGlobalContext,
  getVariableValue,
  hasConstantWithScope,
  setArrayElement,
  targetToInputKey,
} from '@/shared/lib/pseint/runtimeState'
import { executeCallableStatement, executeUserFunction } from '@/shared/lib/pseint/runtimeSubprograms'
import type { RuntimeContext, RuntimeMetrics } from '@/shared/lib/pseint/runtimeTypes'

const MAX_TRACE_STEPS = 2_500

export function executeProgram(ast: ProgramAst, rawInputs: Record<string, string>): RuntimeExecution {
  const declarations = new Map(ast.declarations.map((declaration) => [declaration.name, declaration]))
  const constants = new Map<string, RuntimeScalar>()
  const variables: Record<string, RuntimeValue> = {}

  for (const declaration of ast.declarations) {
    variables[declaration.name] = defaultValueByDeclaration(declaration)
  }

  const metrics: RuntimeMetrics = {
    outputs: [],
    stepsExecuted: 0,
    currentLine: null,
    trace: [],
    traceTruncated: false,
  }

  const ctx: RuntimeContext = {
    program: ast,
    functions: new Map(ast.functions.map((fn) => [fn.name, fn])),
    procedures: new Map(ast.procedures.map((procedure) => [procedure.name, procedure])),
    declarations,
    constants,
    variables,
    inputs: rawInputs,
    metrics,
    parent: null,
  }

  evaluateConstants(ast.constants, ctx, evaluateExpression)

  recordTrace('start', ctx)
  executeStatements(ast.statements, ctx)
  flushPendingLine(metrics)
  recordTrace('finish', ctx)

  return {
    outputs: metrics.outputs,
    variables: ctx.variables,
    stepsExecuted: metrics.stepsExecuted,
    trace: metrics.trace,
    traceTruncated: metrics.traceTruncated,
  }
}

function executeStatements(statements: Statement[], ctx: RuntimeContext): void {
  for (const statement of statements) {
    ctx.metrics.stepsExecuted += 1

    if (statement.kind === 'read') {
      assignInput(statement.target, ctx)
      recordTrace(statement.kind, ctx)
      continue
    }

    if (statement.kind === 'write') {
      const output = statement.expressions.map((expression) => stringifyValue(evaluateExpression(expression, ctx))).join('')
      if (statement.noNewline) {
        ctx.metrics.currentLine = `${ctx.metrics.currentLine ?? ''}${output}`
      } else {
        const line = `${ctx.metrics.currentLine ?? ''}${output}`
        ctx.metrics.outputs.push(line)
        ctx.metrics.currentLine = null
      }
      recordTrace(statement.kind, ctx)
      continue
    }

    if (statement.kind === 'assign') {
      const rawValue = evaluateExpression(statement.expression, ctx)
      assignTarget(statement.target, rawValue, ctx)
      recordTrace(statement.kind, ctx)
      continue
    }

    if (statement.kind === 'call') {
      executeCallableStatement(statement.name, statement.args, ctx, createSubprogramDeps())
      recordTrace(statement.kind, ctx)
      continue
    }

    if (statement.kind === 'if') {
      const conditionValue = evaluateExpression(statement.condition, ctx)
      const shouldRunThen = toBoolean(ensureScalar(conditionValue, 'condicion de Si'))
      executeStatements(shouldRunThen ? statement.thenBranch : statement.elseBranch, ctx)
      recordTrace(statement.kind, ctx)
      continue
    }

    if (statement.kind === 'for') {
      executeForLoop(statement, ctx)
      recordTrace(statement.kind, ctx)
      continue
    }

    if (statement.kind === 'while') {
      executeWhileLoop(statement, ctx)
      recordTrace(statement.kind, ctx)
      continue
    }

    if (statement.kind === 'repeatUntil') {
      executeRepeatUntilLoop(statement, ctx)
      recordTrace(statement.kind, ctx)
      continue
    }

    if (statement.kind === 'switch') {
      executeSwitchStatement(statement, ctx)
      recordTrace(statement.kind, ctx)
      continue
    }

    const neverStatement: never = statement
    throw new PseintRuntimeError(`Sentencia no soportada: ${JSON.stringify(neverStatement)}`)
  }
}

function createSubprogramDeps() {
  return {
    evaluateExpression,
    executeStatements,
    assignTarget,
  }
}

function executeForLoop(statement: Extract<Statement, { kind: 'for' }>, ctx: RuntimeContext): void {
  const { declaration, scope } = getDeclarationWithScope(statement.iterator, ctx)
  if (declaration.dimensions !== null) {
    throw new PseintRuntimeError(`El iterador ${statement.iterator} no puede ser arreglo.`)
  }
  ensureNumericType(declaration.varType, statement.iterator)

  const start = toFiniteNumber(ensureScalar(evaluateExpression(statement.start, ctx), 'inicio de Para'), 'valor inicial de Para')
  const end = toFiniteNumber(ensureScalar(evaluateExpression(statement.end, ctx), 'final de Para'), 'valor final de Para')
  const step = toFiniteNumber(ensureScalar(evaluateExpression(statement.step, ctx), 'paso de Para'), 'paso de Para')

  if (step === 0) {
    throw new PseintRuntimeError('El paso en Para no puede ser 0.')
  }

  let current = start
  let iterations = 0

  const shouldContinue = step > 0
    ? () => current <= end
    : () => current >= end

  while (shouldContinue()) {
    iterations += 1
    ensureLoopLimit(iterations, 'Para')

    scope.variables[statement.iterator] = coerceToType(current, declaration.varType, statement.iterator)
    executeStatements(statement.body, ctx)

    current += step
  }
}

function executeWhileLoop(statement: Extract<Statement, { kind: 'while' }>, ctx: RuntimeContext): void {
  let iterations = 0

  while (true) {
    const conditionValue = evaluateExpression(statement.condition, ctx)
    const shouldRun = toBoolean(ensureScalar(conditionValue, 'condicion de Mientras'))
    if (!shouldRun) {
      return
    }

    iterations += 1
    ensureLoopLimit(iterations, 'Mientras')

    executeStatements(statement.body, ctx)
  }
}

function executeRepeatUntilLoop(statement: Extract<Statement, { kind: 'repeatUntil' }>, ctx: RuntimeContext): void {
  let iterations = 0

  while (true) {
    iterations += 1
    ensureLoopLimit(iterations, 'Repetir')

    executeStatements(statement.body, ctx)
    const conditionValue = evaluateExpression(statement.condition, ctx)
    const shouldStop = toBoolean(ensureScalar(conditionValue, 'condicion de Hasta Que'))
    if (shouldStop) {
      return
    }
  }
}

function executeSwitchStatement(statement: Extract<Statement, { kind: 'switch' }>, ctx: RuntimeContext): void {
  const evaluatedSwitchValue = ensureScalar(evaluateExpression(statement.expression, ctx), 'expresion de Segun')

  for (const caseBranch of statement.cases) {
    for (const valueExpression of caseBranch.values) {
      const evaluatedCaseValue = ensureScalar(evaluateExpression(valueExpression, ctx), 'valor de caso en Segun')
      if (valuesEqual(evaluatedSwitchValue, evaluatedCaseValue)) {
        executeStatements(caseBranch.body, ctx)
        return
      }
    }
  }

  executeStatements(statement.defaultBranch, ctx)
}

function evaluateExpression(expression: Expression, ctx: RuntimeContext): RuntimeValue {
  if (expression.kind === 'literal') {
    return expression.value
  }

  if (expression.kind === 'identifier') {
    return getVariableValue(expression.name, ctx)
  }

  if (expression.kind === 'arrayElement') {
    const { declaration, scope } = getDeclarationWithScope(expression.name, ctx)
    if (declaration.dimensions === null) {
      throw new PseintRuntimeError(`La variable ${expression.name} no es un arreglo.`)
    }

    const indices = evaluateArrayIndices(expression.indices, expression.name, declaration.dimensions.length, ctx, evaluateExpression)
    const rawArray = scope.variables[expression.name]

    if (!Array.isArray(rawArray)) {
      throw new PseintRuntimeError(`La variable ${expression.name} no contiene un arreglo valido.`)
    }

    return getArrayElement(rawArray, indices, expression.name)
  }

  if (expression.kind === 'unary') {
    const operand = ensureScalar(evaluateExpression(expression.operand, ctx), 'operando de No')
    return !toBoolean(operand)
  }

  if (expression.kind === 'binary') {
    const left = ensureScalar(evaluateExpression(expression.left, ctx), 'operando izquierdo')
    const right = ensureScalar(evaluateExpression(expression.right, ctx), 'operando derecho')

    switch (expression.operator) {
      case 'O':
        return toBoolean(left) || toBoolean(right)
      case 'Y':
        return toBoolean(left) && toBoolean(right)
      case '+':
        if (typeof left === 'string' || typeof right === 'string') {
          return stringifyValue(left) + stringifyValue(right)
        }
        return Number(left) + Number(right)
      case '-':
        return Number(left) - Number(right)
      case '*':
        return Number(left) * Number(right)
      case '/': {
        const denominator = Number(right)
        if (denominator === 0) {
          throw new PseintRuntimeError('Division por cero.')
        }
        return Number(left) / denominator
      }
      case '%': {
        const denominator = Number(right)
        if (denominator === 0) {
          throw new PseintRuntimeError('Division por cero.')
        }
        return Number(left) % denominator
      }
      case '>=':
        return Number(left) >= Number(right)
      case '<=':
        return Number(left) <= Number(right)
      case '>':
        return Number(left) > Number(right)
      case '<':
        return Number(left) < Number(right)
      case '==':
        return valuesEqual(left, right)
      case '!=':
        return !valuesEqual(left, right)
    }

    throw new PseintRuntimeError('Operador no soportado.')
  }

  if (expression.kind === 'functionCall') {
    const normalizedName = expression.name.toLowerCase()

    if (normalizedName === 'subcadena') {
      return evaluateSubcadena(expression.args, ctx)
    }

    if (normalizedName === 'longitud') {
      return evaluateLongitud(expression.args, ctx)
    }

    if (normalizedName === 'mayusculas') {
      return evaluateMayusculas(expression.args, ctx)
    }

    if (normalizedName === 'minusculas') {
      return evaluateMinusculas(expression.args, ctx)
    }

    if (normalizedName === 'concatenar') {
      return evaluateConcatenar(expression.args, ctx)
    }

    const userFunction = ctx.functions.get(expression.name)
    if (!userFunction) {
      if (ctx.procedures.has(expression.name)) {
        throw new PseintRuntimeError(`No puedes usar el procedimiento ${expression.name} como expresion.`)
      }
      throw new PseintRuntimeError(`Funcion no soportada: ${expression.name}`)
    }

    return executeUserFunction(userFunction, expression.args, ctx, createSubprogramDeps())
  }

  const neverExpression: never = expression
  throw new PseintRuntimeError(`Expresion no soportada: ${JSON.stringify(neverExpression)}`)
}

function evaluateSubcadena(args: Expression[], ctx: RuntimeContext): RuntimeValue {
  if (args.length !== 3) {
    throw new PseintRuntimeError('Subcadena requiere exactamente 3 argumentos.')
  }

  const rawText = ensureScalar(evaluateExpression(args[0], ctx), 'texto en Subcadena')
  const rawStart = ensureScalar(evaluateExpression(args[1], ctx), 'indice inicial en Subcadena')
  const rawEnd = ensureScalar(evaluateExpression(args[2], ctx), 'indice final en Subcadena')

  const text = stringifyValue(rawText)
  const start = Number(rawStart)
  const end = Number(rawEnd)

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    throw new PseintRuntimeError('Subcadena requiere indices numericos.')
  }

  if (start < 1 || end < start) {
    return ''
  }

  return text.slice(start - 1, end)
}

function evaluateLongitud(args: Expression[], ctx: RuntimeContext): RuntimeValue {
  if (args.length !== 1) {
    throw new PseintRuntimeError('Longitud requiere exactamente 1 argumento.')
  }

  const rawValue = ensureScalar(evaluateExpression(args[0], ctx), 'argumento de Longitud')
  return stringifyValue(rawValue).length
}

function evaluateMayusculas(args: Expression[], ctx: RuntimeContext): RuntimeValue {
  if (args.length !== 1) {
    throw new PseintRuntimeError('Mayusculas requiere exactamente 1 argumento.')
  }

  const rawValue = ensureScalar(evaluateExpression(args[0], ctx), 'argumento de Mayusculas')
  return stringifyValue(rawValue).toUpperCase()
}

function evaluateMinusculas(args: Expression[], ctx: RuntimeContext): RuntimeValue {
  if (args.length !== 1) {
    throw new PseintRuntimeError('Minusculas requiere exactamente 1 argumento.')
  }

  const rawValue = ensureScalar(evaluateExpression(args[0], ctx), 'argumento de Minusculas')
  return stringifyValue(rawValue).toLowerCase()
}

function evaluateConcatenar(args: Expression[], ctx: RuntimeContext): RuntimeValue {
  if (args.length < 2) {
    throw new PseintRuntimeError('Concatenar requiere al menos 2 argumentos.')
  }

  const values = args.map((arg) => ensureScalar(evaluateExpression(arg, ctx), 'argumento de Concatenar'))
  return values.map((value) => stringifyValue(value)).join('')
}

function assignInput(target: TargetRef, ctx: RuntimeContext): void {
  const inputKey = targetToInputKey(target, ctx, evaluateExpression)
  const rawInput = ctx.inputs[inputKey]

  if (rawInput === undefined) {
    throw new PseintRuntimeError(`Falta valor para la entrada "${inputKey}".`)
  }

  assignTarget(target, rawInput, ctx)
}

function assignTarget(target: TargetRef, rawValue: RuntimeValue, ctx: RuntimeContext): void {
  if (target.kind === 'variable') {
    if (hasConstantWithScope(target.name, ctx)) {
      throw new PseintRuntimeError(`No se puede reasignar la constante ${target.name}.`)
    }

    const { declaration, scope } = getDeclarationWithScope(target.name, ctx)
    if (declaration.dimensions !== null) {
      throw new PseintRuntimeError(`No se puede asignar valor escalar al arreglo ${target.name} sin indice.`)
    }

    const scalarValue = ensureScalar(rawValue, `asignacion a ${target.name}`)
    scope.variables[target.name] = coerceToType(scalarValue, declaration.varType, target.name)
    return
  }

  const { declaration, scope } = getDeclarationWithScope(target.name, ctx)
  if (declaration.dimensions === null) {
    throw new PseintRuntimeError(`La variable ${target.name} no es un arreglo.`)
  }

  const indices = evaluateArrayIndices(target.indices, target.name, declaration.dimensions.length, ctx, evaluateExpression)

  const rawArray = scope.variables[target.name]
  if (!Array.isArray(rawArray)) {
    throw new PseintRuntimeError(`La variable ${target.name} no contiene un arreglo valido.`)
  }

  const scalarValue = ensureScalar(rawValue, `asignacion a ${target.name}`)
  const coerced = coerceToType(scalarValue, declaration.varType, `${target.name}[${indices.map((idx) => idx + 1).join(',')}]`)

  setArrayElement(rawArray, indices, coerced, target.name)
}

function recordTrace(marker: RuntimeStepSnapshot['marker'], ctx: RuntimeContext): void {
  if (ctx.metrics.trace.length >= MAX_TRACE_STEPS) {
    ctx.metrics.traceTruncated = true
    return
  }

  const globalCtx = getGlobalContext(ctx)
  ctx.metrics.trace.push({
    marker,
    stepNumber: ctx.metrics.stepsExecuted,
    outputs: buildVisibleOutputs(ctx.metrics),
    variables: cloneVariables(globalCtx.variables),
  })
}

function flushPendingLine(metrics: RuntimeMetrics): void {
  if (metrics.currentLine !== null) {
    metrics.outputs.push(metrics.currentLine)
    metrics.currentLine = null
  }
}
