import type {
  Expression,
  FunctionParameter,
  ProgramAst,
  ProgramDeclaration,
  ProgramFunction,
  PseintVarType,
  RuntimeExecution,
  RuntimeScalar,
  RuntimeValue,
  Statement,
  TargetRef,
} from '@/entities/pseint/model/types'

export class PseintRuntimeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PseintRuntimeError'
  }
}

interface RuntimeMetrics {
  outputs: string[]
  stepsExecuted: number
  currentLine: string | null
}

interface RuntimeContext {
  program: ProgramAst
  functions: Map<string, ProgramFunction>
  declarations: Map<string, ProgramDeclaration>
  variables: Record<string, RuntimeValue>
  inputs: Record<string, string>
  metrics: RuntimeMetrics
  parent: RuntimeContext | null
}

const MAX_LOOP_ITERATIONS = 100_000

export function executeProgram(ast: ProgramAst, rawInputs: Record<string, string>): RuntimeExecution {
  const declarations = new Map(ast.declarations.map((declaration) => [declaration.name, declaration]))
  const variables: Record<string, RuntimeValue> = {}

  for (const declaration of ast.declarations) {
    variables[declaration.name] = defaultValueByDeclaration(declaration)
  }

  const metrics: RuntimeMetrics = {
    outputs: [],
    stepsExecuted: 0,
    currentLine: null,
  }

  const ctx: RuntimeContext = {
    program: ast,
    functions: new Map(ast.functions.map((fn) => [fn.name, fn])),
    declarations,
    variables,
    inputs: rawInputs,
    metrics,
    parent: null,
  }

  executeStatements(ast.statements, ctx)
  flushPendingLine(metrics)

  return {
    outputs: metrics.outputs,
    variables: ctx.variables,
    stepsExecuted: metrics.stepsExecuted,
  }
}

function executeStatements(statements: Statement[], ctx: RuntimeContext): void {
  for (const statement of statements) {
    ctx.metrics.stepsExecuted += 1

    if (statement.kind === 'read') {
      assignInput(statement.target, ctx)
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
      continue
    }

    if (statement.kind === 'assign') {
      const rawValue = evaluateExpression(statement.expression, ctx)
      assignTarget(statement.target, rawValue, ctx)
      continue
    }

    if (statement.kind === 'if') {
      const conditionValue = evaluateExpression(statement.condition, ctx)
      const shouldRunThen = toBoolean(ensureScalar(conditionValue, 'condicion de Si'))
      executeStatements(shouldRunThen ? statement.thenBranch : statement.elseBranch, ctx)
      continue
    }

    if (statement.kind === 'for') {
      executeForLoop(statement, ctx)
      continue
    }

    const neverStatement: never = statement
    throw new PseintRuntimeError(`Sentencia no soportada: ${JSON.stringify(neverStatement)}`)
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
    if (iterations > MAX_LOOP_ITERATIONS) {
      throw new PseintRuntimeError('Se supero el limite de iteraciones del ciclo Para.')
    }

    scope.variables[statement.iterator] = coerceToType(current, declaration.varType, statement.iterator)
    executeStatements(statement.body, ctx)

    current += step
  }
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

    const indices = evaluateArrayIndices(expression.indices, expression.name, declaration.dimensions.length, ctx)
    const rawArray = scope.variables[expression.name]

    if (!Array.isArray(rawArray)) {
      throw new PseintRuntimeError(`La variable ${expression.name} no contiene un arreglo valido.`)
    }

    return getArrayElement(rawArray, indices, expression.name)
  }

  if (expression.kind === 'binary') {
    const left = ensureScalar(evaluateExpression(expression.left, ctx), 'operando izquierdo')
    const right = ensureScalar(evaluateExpression(expression.right, ctx), 'operando derecho')

    switch (expression.operator) {
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
      case '>=':
        return Number(left) >= Number(right)
      case '<=':
        return Number(left) <= Number(right)
      case '>':
        return Number(left) > Number(right)
      case '<':
        return Number(left) < Number(right)
      case '==':
        return left === right
      case '!=':
        return left !== right
      default: {
        const neverOperator: never = expression.operator
        throw new PseintRuntimeError(`Operador no soportado: ${neverOperator}`)
      }
    }
  }

  if (expression.kind === 'functionCall') {
    if (expression.name === 'Subcadena') {
      return evaluateSubcadena(expression.args, ctx)
    }

    const userFunction = ctx.functions.get(expression.name)
    if (!userFunction) {
      throw new PseintRuntimeError(`Funcion no soportada: ${expression.name}`)
    }

    const args = expression.args.map((arg) => evaluateExpression(arg, ctx))
    return executeUserFunction(userFunction, args, ctx)
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

function executeUserFunction(programFunction: ProgramFunction, args: RuntimeValue[], parentCtx: RuntimeContext): RuntimeValue {
  if (args.length !== programFunction.parameters.length) {
    throw new PseintRuntimeError(
      `La funcion ${programFunction.name} esperaba ${programFunction.parameters.length} argumentos y recibio ${args.length}.`,
    )
  }

  const declarations = new Map<string, ProgramDeclaration>()
  const variables: Record<string, RuntimeValue> = {}

  for (let index = 0; index < programFunction.parameters.length; index += 1) {
    const parameter = programFunction.parameters[index]
    const value = args[index]
    const declaration = inferDeclarationFromParameter(parameter, value)
    declarations.set(parameter.name, declaration)
    variables[parameter.name] = cloneRuntimeValue(value)
  }

  for (const declaration of programFunction.declarations) {
    if (declarations.has(declaration.name)) {
      throw new PseintRuntimeError(`Parametro redeclarado en funcion ${programFunction.name}: ${declaration.name}`)
    }
    declarations.set(declaration.name, declaration)
    variables[declaration.name] = defaultValueByDeclaration(declaration)
  }

  if (!declarations.has(programFunction.returnVariable)) {
    const returnDeclaration: ProgramDeclaration = {
      kind: 'declaration',
      name: programFunction.returnVariable,
      varType: 'Real',
      dimensions: null,
    }
    declarations.set(programFunction.returnVariable, returnDeclaration)
    variables[programFunction.returnVariable] = defaultValueByDeclaration(returnDeclaration)
  }

  const childCtx: RuntimeContext = {
    program: parentCtx.program,
    functions: parentCtx.functions,
    declarations,
    variables,
    inputs: parentCtx.inputs,
    metrics: parentCtx.metrics,
    parent: parentCtx,
  }

  executeStatements(programFunction.statements, childCtx)

  return childCtx.variables[programFunction.returnVariable]
}

function inferDeclarationFromParameter(parameter: FunctionParameter, value: RuntimeValue): ProgramDeclaration {
  if (parameter.isArray) {
    if (!Array.isArray(value)) {
      throw new PseintRuntimeError(`El parametro ${parameter.name} debe recibir un arreglo.`)
    }

    const dimensions = inferArrayDimensions(value)
    if (parameter.arrayRank > 0 && dimensions.length !== parameter.arrayRank) {
      throw new PseintRuntimeError(
        `El parametro ${parameter.name} esperaba arreglo de ${parameter.arrayRank} dimension(es) y recibio ${dimensions.length}.`,
      )
    }

    return {
      kind: 'declaration',
      name: parameter.name,
      varType: inferScalarTypeFromValue(value),
      dimensions,
    }
  }

  if (Array.isArray(value)) {
    throw new PseintRuntimeError(`El parametro ${parameter.name} esperaba un valor escalar.`)
  }

  return {
    kind: 'declaration',
    name: parameter.name,
    varType: inferScalarTypeFromValue(value),
    dimensions: null,
  }
}

function inferArrayDimensions(value: RuntimeValue): number[] {
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

function inferScalarTypeFromValue(value: RuntimeValue): PseintVarType {
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

function assignInput(target: TargetRef, ctx: RuntimeContext): void {
  const inputKey = targetToInputKey(target, ctx)
  const rawInput = ctx.inputs[inputKey]

  if (rawInput === undefined) {
    throw new PseintRuntimeError(`Falta valor para la entrada "${inputKey}".`)
  }

  assignTarget(target, rawInput, ctx)
}

function assignTarget(target: TargetRef, rawValue: RuntimeValue, ctx: RuntimeContext): void {
  if (target.kind === 'variable') {
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

  const indices = evaluateArrayIndices(target.indices, target.name, declaration.dimensions.length, ctx)

  const rawArray = scope.variables[target.name]
  if (!Array.isArray(rawArray)) {
    throw new PseintRuntimeError(`La variable ${target.name} no contiene un arreglo valido.`)
  }

  const scalarValue = ensureScalar(rawValue, `asignacion a ${target.name}`)
  const coerced = coerceToType(scalarValue, declaration.varType, `${target.name}[${indices.map((idx) => idx + 1).join(',')}]`)

  setArrayElement(rawArray, indices, coerced, target.name)
}

function targetToInputKey(target: TargetRef, ctx: RuntimeContext): string {
  if (target.kind === 'variable') {
    return target.name
  }

  const { declaration } = getDeclarationWithScope(target.name, ctx)
  if (declaration.dimensions === null) {
    throw new PseintRuntimeError(`La variable ${target.name} no es un arreglo.`)
  }

  const indices = evaluateArrayIndices(target.indices, target.name, declaration.dimensions.length, ctx)
  return `${target.name}[${indices.map((index) => index + 1).join(',')}]`
}

function getDeclarationWithScope(target: string, ctx: RuntimeContext): { declaration: ProgramDeclaration; scope: RuntimeContext } {
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

function getVariableValue(name: string, ctx: RuntimeContext): RuntimeValue {
  let current: RuntimeContext | null = ctx

  while (current) {
    if (Object.prototype.hasOwnProperty.call(current.variables, name)) {
      return current.variables[name]
    }

    current = current.parent
  }

  throw new PseintRuntimeError(`Variable no declarada: ${name}`)
}

function defaultValueByDeclaration(declaration: ProgramDeclaration): RuntimeValue {
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

function evaluateArrayIndices(
  indexExpressions: Expression[],
  arrayName: string,
  expectedLength: number,
  ctx: RuntimeContext,
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

function getArrayElement(rawArray: RuntimeValue[], indices: number[], arrayName: string): RuntimeValue {
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

function setArrayElement(rawArray: RuntimeValue[], indices: number[], value: RuntimeScalar, arrayName: string): void {
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

function coerceToType(value: RuntimeScalar, type: PseintVarType, variableName: string): RuntimeScalar {
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

function ensureNumericType(type: PseintVarType, variableName: string): void {
  if (type !== 'Entero' && type !== 'Real') {
    throw new PseintRuntimeError(`El iterador ${variableName} en Para debe ser Entero o Real.`)
  }
}

function ensureScalar(value: RuntimeValue, context: string): RuntimeScalar {
  if (Array.isArray(value)) {
    throw new PseintRuntimeError(`Se esperaba un valor escalar en ${context}.`)
  }
  return value
}

function toFiniteNumber(value: RuntimeScalar, context: string): number {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) {
    throw new PseintRuntimeError(`Se esperaba un numero en ${context}.`)
  }
  return numeric
}

function toArrayIndex(value: RuntimeScalar, arrayName: string): number {
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

function toBoolean(value: RuntimeScalar): boolean {
  if (typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'number') {
    return value !== 0
  }
  const normalized = value.trim().toLowerCase()
  return normalized !== '' && normalized !== 'false' && normalized !== 'falso' && normalized !== '0'
}

function stringifyValue(value: RuntimeValue): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stringifyValue(item)).join(', ')}]`
  }

  if (typeof value === 'boolean') {
    return value ? 'Verdadero' : 'Falso'
  }
  return String(value)
}

function cloneRuntimeValue(value: RuntimeValue): RuntimeValue {
  if (!Array.isArray(value)) {
    return value
  }

  return value.map((item) => cloneRuntimeValue(item))
}

function flushPendingLine(metrics: RuntimeMetrics): void {
  if (metrics.currentLine !== null) {
    metrics.outputs.push(metrics.currentLine)
    metrics.currentLine = null
  }
}
