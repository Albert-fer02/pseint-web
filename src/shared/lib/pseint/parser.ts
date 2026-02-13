import type {
  ProgramAst,
  ProgramConstant,
  ProgramDeclaration,
  ProgramFunction,
  ProgramProcedure,
} from '../../../entities/pseint/model/types'
import {
  ASSIGNMENT_REGEX,
  CALL_REGEX,
  CONSTANT_REGEX,
  DECLARATION_REGEX,
  normalizeSource,
  PseintParseError,
} from './parserCore'
import type { ParserState } from './parserCore'
import {
  appendConstant,
  appendDeclarations,
} from './parserDeclarations'
import { parseStatements } from './parserStatements'
import {
  parseFunction,
  parseSubprocess,
} from './parserSubprograms'

export { PseintParseError } from './parserCore'

export function parseProgram(source: string): ProgramAst {
  const lines = normalizeSource(source)
  const state: ParserState = { lines, index: 0 }

  const startLine = state.lines[state.index]
  if (!startLine || !startLine.text.startsWith('Algoritmo ')) {
    throw new PseintParseError('Debe iniciar con "Algoritmo <Nombre>".')
  }

  const programName = startLine.text.replace(/^Algoritmo\s+/, '').trim()
  if (!programName) {
    throw new PseintParseError('El algoritmo debe tener nombre.', startLine.line)
  }
  state.index += 1

  const declarations: ProgramDeclaration[] = []
  const constants: ProgramConstant[] = []
  const declaredNames = new Set<string>()
  consumeDeclarationsAndConstants(state, declarations, constants, declaredNames)

  const statements = parseStatements(state, ['FinAlgoritmo'], declarations, constants, declaredNames)
  const endLine = state.lines[state.index]
  if (!endLine || endLine.text !== 'FinAlgoritmo') {
    throw new PseintParseError('Falta "FinAlgoritmo" al final.')
  }
  state.index += 1

  const functions: ProgramFunction[] = []
  const procedures: ProgramProcedure[] = []
  consumeSubprograms(state, functions, procedures)

  return {
    name: programName,
    declarations,
    constants,
    statements,
    functions,
    procedures,
  }
}

function consumeDeclarationsAndConstants(
  state: ParserState,
  declarations: ProgramDeclaration[],
  constants: ProgramConstant[],
  declaredNames: Set<string>,
): void {
  while (state.index < state.lines.length) {
    const current = state.lines[state.index]
    if (!current) {
      break
    }

    const declarationMatch = current.text.match(DECLARATION_REGEX)
    if (declarationMatch?.[1] && declarationMatch[2]) {
      appendDeclarations(declarationMatch[1], declarationMatch[2], current.line, declarations, declaredNames)
      state.index += 1
      continue
    }

    const constantMatch = current.text.match(CONSTANT_REGEX)
    if (constantMatch?.[1] && constantMatch[2]) {
      appendConstant(constantMatch[1], constantMatch[2], current.line, constants, declaredNames)
      state.index += 1
      continue
    }

    break
  }
}

function consumeSubprograms(
  state: ParserState,
  functions: ProgramFunction[],
  procedures: ProgramProcedure[],
): void {
  const functionNames = new Set<string>()
  const procedureNames = new Set<string>()

  while (state.index < state.lines.length) {
    const current = state.lines[state.index]
    if (!current) {
      break
    }

    if (current.text.startsWith('Funcion ')) {
      const programFunction = parseFunction(state)
      registerSubprogramName(programFunction.name, current.line, functionNames, procedureNames)
      functions.push(programFunction)
      continue
    }

    if (current.text.startsWith('SubProceso ')) {
      const parsed = parseSubprocess(state)
      registerSubprogramName(parsed.value.name, current.line, functionNames, procedureNames)
      if (parsed.kind === 'function') {
        functions.push(parsed.value)
      } else {
        procedures.push(parsed.value)
      }
      continue
    }

    throw createOutOfScopeStatementError(current.line, current.text)
  }
}

function registerSubprogramName(
  name: string,
  line: number,
  functionNames: Set<string>,
  procedureNames: Set<string>,
): void {
  if (functionNames.has(name) || procedureNames.has(name)) {
    throw new PseintParseError(`Subprograma ya declarado: "${name}"`, line)
  }

  functionNames.add(name)
  procedureNames.add(name)
}

function createOutOfScopeStatementError(line: number, text: string): PseintParseError {
  if (isLikelyExecutableStatement(text)) {
    return new PseintParseError(
      `La sentencia esta fuera de Algoritmo, Funcion o SubProceso: "${text}". Colocala antes de "FinAlgoritmo" o dentro de una "Funcion" o "SubProceso".`,
      line,
    )
  }

  return new PseintParseError(`Sentencia no soportada fuera de Algoritmo: "${text}"`, line)
}

function isLikelyExecutableStatement(text: string): boolean {
  if (ASSIGNMENT_REGEX.test(text) || CALL_REGEX.test(text)) {
    return true
  }

  return /^(Definir|Constante|Leer|Escribir|Si|Sino|Para|Mientras|Repetir|Segun)\b/i.test(text)
}
