import type {
  ProgramConstant,
  ProgramDeclaration,
  ProgramFunction,
  ProgramProcedure,
} from '@/entities/pseint/model/types'
import {
  FUNCTION_HEADER_REGEX,
  PseintParseError,
  SUBPROCESS_HEADER_REGEX,
  SUBPROCESS_WITH_RETURN_HEADER_REGEX,
} from '@/shared/lib/pseint/parserCore'
import type { ParserState } from '@/shared/lib/pseint/parserCore'
import { parseFunctionParameters } from '@/shared/lib/pseint/parserDeclarations'
import { parseStatements } from '@/shared/lib/pseint/parserStatements'

export function parseFunction(state: ParserState): ProgramFunction {
  const headerLine = state.lines[state.index]
  if (!headerLine) {
    throw new PseintParseError('Definicion de funcion incompleta.')
  }

  const headerMatch = headerLine.text.match(FUNCTION_HEADER_REGEX)
  if (!headerMatch?.[1] || !headerMatch[2]) {
    throw new PseintParseError('Cabecera de Funcion invalida.', headerLine.line)
  }

  const returnVariable = headerMatch[1]
  const functionName = headerMatch[2]
  const parameters = parseFunctionParameters(headerMatch[3] ?? '', headerLine.line)

  state.index += 1

  const declarations: ProgramDeclaration[] = []
  const constants: ProgramConstant[] = []
  const declaredNames = new Set<string>([returnVariable])

  for (const parameter of parameters) {
    if (declaredNames.has(parameter.name)) {
      throw new PseintParseError(`Parametro repetido en funcion: "${parameter.name}"`, headerLine.line)
    }
    declaredNames.add(parameter.name)
  }

  const statements = parseStatements(state, ['FinFuncion'], declarations, constants, declaredNames)

  const endFunction = state.lines[state.index]
  if (!endFunction || endFunction.text !== 'FinFuncion') {
    throw new PseintParseError(`Falta "FinFuncion" para ${functionName}.`, headerLine.line)
  }

  state.index += 1

  return {
    name: functionName,
    returnVariable,
    parameters,
    declarations,
    constants,
    statements,
  }
}

export function parseSubprocess(
  state: ParserState,
): { kind: 'function'; value: ProgramFunction } | { kind: 'procedure'; value: ProgramProcedure } {
  const headerLine = state.lines[state.index]
  if (!headerLine) {
    throw new PseintParseError('Definicion de SubProceso incompleta.')
  }

  const withReturnHeader = headerLine.text.match(SUBPROCESS_WITH_RETURN_HEADER_REGEX)
  if (withReturnHeader?.[1] && withReturnHeader[2]) {
    const returnVariable = withReturnHeader[1]
    const functionName = withReturnHeader[2]
    const parameters = parseFunctionParameters(withReturnHeader[3] ?? '', headerLine.line)
    state.index += 1

    const declarations: ProgramDeclaration[] = []
    const constants: ProgramConstant[] = []
    const declaredNames = new Set<string>([returnVariable])

    for (const parameter of parameters) {
      if (declaredNames.has(parameter.name)) {
        throw new PseintParseError(`Parametro repetido en subproceso: "${parameter.name}"`, headerLine.line)
      }
      declaredNames.add(parameter.name)
    }

    const statements = parseStatements(state, ['FinSubProceso'], declarations, constants, declaredNames)
    const end = state.lines[state.index]
    if (!end || end.text !== 'FinSubProceso') {
      throw new PseintParseError(`Falta "FinSubProceso" para ${functionName}.`, headerLine.line)
    }
    state.index += 1

    return {
      kind: 'function',
      value: {
        name: functionName,
        returnVariable,
        parameters,
        declarations,
        constants,
        statements,
      },
    }
  }

  const procedureHeader = headerLine.text.match(SUBPROCESS_HEADER_REGEX)
  if (!procedureHeader?.[1]) {
    throw new PseintParseError('Cabecera de SubProceso invalida.', headerLine.line)
  }

  const procedureName = procedureHeader[1]
  const parameters = parseFunctionParameters(procedureHeader[2] ?? '', headerLine.line)
  state.index += 1

  const declarations: ProgramDeclaration[] = []
  const constants: ProgramConstant[] = []
  const declaredNames = new Set<string>()

  for (const parameter of parameters) {
    if (declaredNames.has(parameter.name)) {
      throw new PseintParseError(`Parametro repetido en subproceso: "${parameter.name}"`, headerLine.line)
    }
    declaredNames.add(parameter.name)
  }

  const statements = parseStatements(state, ['FinSubProceso'], declarations, constants, declaredNames)
  const end = state.lines[state.index]
  if (!end || end.text !== 'FinSubProceso') {
    throw new PseintParseError(`Falta "FinSubProceso" para ${procedureName}.`, headerLine.line)
  }
  state.index += 1

  return {
    kind: 'procedure',
    value: {
      name: procedureName,
      parameters,
      declarations,
      constants,
      statements,
    },
  }
}
