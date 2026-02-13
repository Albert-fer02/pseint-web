import type {
  Expression,
  FunctionParameter,
  ProgramConstant,
  ProgramDeclaration,
  ProgramFunction,
  ProgramProcedure,
  RuntimeScalar,
  RuntimeValue,
  Statement,
  TargetRef,
} from '../../../entities/pseint/model/types'
import {
  cloneRuntimeValue,
  defaultValueByDeclaration,
  ensureArrayShapeMatchesDeclaration,
  inferArrayDimensions,
  inferScalarTypeFromValue,
} from './runtimePrimitives'
import { PseintRuntimeError } from './runtimeError'
import { evaluateArrayIndices, evaluateConstants, getDeclarationWithScope } from './runtimeState'
import type { RuntimeContext } from './runtimeTypes'

interface ResolvedCallArgument {
  value: RuntimeValue
  writeBackTarget: TargetRef | null
}

interface SubprogramRuntimeDeps {
  evaluateExpression: (expression: Expression, ctx: RuntimeContext) => RuntimeValue
  executeStatements: (statements: Statement[], ctx: RuntimeContext) => void
  assignTarget: (target: TargetRef, rawValue: RuntimeValue, ctx: RuntimeContext) => void
}

export function executeCallableStatement(
  name: string,
  args: Expression[],
  ctx: RuntimeContext,
  deps: SubprogramRuntimeDeps,
): void {
  const procedure = ctx.procedures.get(name)
  if (procedure) {
    executeUserProcedure(procedure, args, ctx, deps)
    return
  }

  const userFunction = ctx.functions.get(name)
  if (userFunction) {
    executeUserFunction(userFunction, args, ctx, deps)
    return
  }

  throw new PseintRuntimeError(`Subproceso no soportado: ${name}`)
}

export function executeUserFunction(
  programFunction: ProgramFunction,
  argExpressions: Expression[],
  parentCtx: RuntimeContext,
  deps: SubprogramRuntimeDeps,
): RuntimeValue {
  const { childCtx, writeBackArguments } = createSubprogramContext({
    name: programFunction.name,
    parameters: programFunction.parameters,
    declarations: programFunction.declarations,
    constants: programFunction.constants,
    argExpressions,
    parentCtx,
    returnVariable: programFunction.returnVariable,
    deps,
  })

  deps.executeStatements(programFunction.statements, childCtx)
  applyWriteBackArguments(writeBackArguments, childCtx, parentCtx, deps)

  return childCtx.variables[programFunction.returnVariable]
}

function executeUserProcedure(
  programProcedure: ProgramProcedure,
  argExpressions: Expression[],
  parentCtx: RuntimeContext,
  deps: SubprogramRuntimeDeps,
): void {
  const { childCtx, writeBackArguments } = createSubprogramContext({
    name: programProcedure.name,
    parameters: programProcedure.parameters,
    declarations: programProcedure.declarations,
    constants: programProcedure.constants,
    argExpressions,
    parentCtx,
    deps,
  })

  deps.executeStatements(programProcedure.statements, childCtx)
  applyWriteBackArguments(writeBackArguments, childCtx, parentCtx, deps)
}

function createSubprogramContext({
  name,
  parameters,
  declarations: rawDeclarations,
  constants: rawConstants,
  argExpressions,
  parentCtx,
  returnVariable,
  deps,
}: {
  name: string
  parameters: FunctionParameter[]
  declarations: ProgramDeclaration[]
  constants: ProgramConstant[]
  argExpressions: Expression[]
  parentCtx: RuntimeContext
  returnVariable?: string
  deps: SubprogramRuntimeDeps
}): {
  childCtx: RuntimeContext
  writeBackArguments: Array<{ parameterName: string; target: TargetRef }>
} {
  const args = resolveCallArguments(name, parameters, argExpressions, parentCtx, deps)
  const declarations = new Map<string, ProgramDeclaration>()
  const variables: Record<string, RuntimeValue> = {}

  for (let index = 0; index < parameters.length; index += 1) {
    const parameter = parameters[index]
    const argument = args[index]
    const declaration = inferDeclarationFromParameter(parameter, argument.value)
    declarations.set(parameter.name, declaration)
    variables[parameter.name] = cloneRuntimeValue(argument.value)
  }

  for (const declaration of rawDeclarations) {
    if (declarations.has(declaration.name)) {
      throw new PseintRuntimeError(`Parametro redeclarado en ${name}: ${declaration.name}`)
    }
    declarations.set(declaration.name, declaration)
    variables[declaration.name] = defaultValueByDeclaration(declaration)
  }

  if (returnVariable && !declarations.has(returnVariable)) {
    const returnDeclaration: ProgramDeclaration = {
      kind: 'declaration',
      name: returnVariable,
      varType: 'Real',
      dimensions: null,
    }
    declarations.set(returnVariable, returnDeclaration)
    variables[returnVariable] = defaultValueByDeclaration(returnDeclaration)
  }

  const childCtx: RuntimeContext = {
    program: parentCtx.program,
    functions: parentCtx.functions,
    procedures: parentCtx.procedures,
    declarations,
    constants: new Map<string, RuntimeScalar>(),
    variables,
    inputs: parentCtx.inputs,
    metrics: parentCtx.metrics,
    parent: parentCtx,
  }

  evaluateConstants(rawConstants, childCtx, deps.evaluateExpression)

  return {
    childCtx,
    writeBackArguments: args
      .map((arg, index) => ({ arg, parameterName: parameters[index]?.name ?? '' }))
      .filter(({ arg }) => arg.writeBackTarget !== null)
      .map(({ arg, parameterName }) => ({
        parameterName,
        target: arg.writeBackTarget as TargetRef,
      })),
  }
}

function resolveCallArguments(
  subprogramName: string,
  parameters: FunctionParameter[],
  argExpressions: Expression[],
  ctx: RuntimeContext,
  deps: SubprogramRuntimeDeps,
): ResolvedCallArgument[] {
  if (argExpressions.length !== parameters.length) {
    throw new PseintRuntimeError(
      `El subproceso ${subprogramName} esperaba ${parameters.length} argumentos y recibio ${argExpressions.length}.`,
    )
  }

  const resolved: ResolvedCallArgument[] = []
  for (let index = 0; index < parameters.length; index += 1) {
    const parameter = parameters[index]
    const argExpression = argExpressions[index]
    if (!argExpression) {
      throw new PseintRuntimeError(`Argumento faltante en subproceso ${subprogramName}.`)
    }

    const value = deps.evaluateExpression(argExpression, ctx)
    const writeBackTarget = parameter.byReference
      ? resolveReferenceTarget(argExpression, parameter, ctx, deps)
      : null

    resolved.push({
      value,
      writeBackTarget,
    })
  }

  return resolved
}

function resolveReferenceTarget(
  expression: Expression,
  parameter: FunctionParameter,
  ctx: RuntimeContext,
  deps: SubprogramRuntimeDeps,
): TargetRef {
  if (expression.kind === 'identifier') {
    const { declaration } = getDeclarationWithScope(expression.name, ctx)
    if (parameter.isArray && declaration.dimensions === null) {
      throw new PseintRuntimeError(`El parametro ${parameter.name} requiere un arreglo por referencia.`)
    }
    if (!parameter.isArray && declaration.dimensions !== null) {
      throw new PseintRuntimeError(`El parametro ${parameter.name} requiere un valor escalar por referencia.`)
    }

    return {
      kind: 'variable',
      name: expression.name,
    }
  }

  if (expression.kind === 'arrayElement') {
    if (parameter.isArray) {
      throw new PseintRuntimeError(`El parametro ${parameter.name} requiere un arreglo completo por referencia.`)
    }

    const { declaration } = getDeclarationWithScope(expression.name, ctx)
    if (declaration.dimensions === null) {
      throw new PseintRuntimeError(`La variable ${expression.name} no es un arreglo.`)
    }

    const evaluatedIndices = evaluateArrayIndices(
      expression.indices,
      expression.name,
      declaration.dimensions.length,
      ctx,
      deps.evaluateExpression,
    )
    return {
      kind: 'arrayElement',
      name: expression.name,
      indices: evaluatedIndices.map((index) => ({
        kind: 'literal',
        value: index + 1,
      })),
    }
  }

  throw new PseintRuntimeError(`El parametro ${parameter.name} por referencia requiere una variable o arreglo.`)
}

function applyWriteBackArguments(
  writeBackArguments: Array<{ parameterName: string; target: TargetRef }>,
  childCtx: RuntimeContext,
  parentCtx: RuntimeContext,
  deps: SubprogramRuntimeDeps,
): void {
  for (const writeBackArgument of writeBackArguments) {
    const updatedValue = childCtx.variables[writeBackArgument.parameterName]
    assignReferenceTarget(writeBackArgument.target, updatedValue, parentCtx, deps)
  }
}

function assignReferenceTarget(target: TargetRef, value: RuntimeValue, ctx: RuntimeContext, deps: SubprogramRuntimeDeps): void {
  if (target.kind === 'variable') {
    const { declaration, scope } = getDeclarationWithScope(target.name, ctx)
    if (declaration.dimensions !== null) {
      if (!Array.isArray(value)) {
        throw new PseintRuntimeError(`Se esperaba un arreglo para asignar por referencia en ${target.name}.`)
      }
      ensureArrayShapeMatchesDeclaration(value, declaration.dimensions, target.name)
      scope.variables[target.name] = cloneRuntimeValue(value)
      return
    }
  }

  deps.assignTarget(target, value, ctx)
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
