import type { BinaryOperator, PseintVarType } from '@/entities/pseint/model/types'

export const DECLARATION_REGEX = /^Definir\s+(.+)\s+Como\s+(Cadena|Entero|Real|Logico|Caracter)\s*;?$/i
export const CONSTANT_REGEX = /^Constante\s+([A-Za-z_][A-Za-z0-9_]*)\s*<-\s*(.+?)\s*;?$/i
export const READ_REGEX = /^Leer\s+(.+?)\s*;?$/i
export const ASSIGNMENT_REGEX = /^(.+?)\s*<-\s*(.+?)\s*;?$/
export const CALL_REGEX = /^([A-Za-z_][A-Za-z0-9_]*)(?:\((.*)\))?\s*;?$/
export const IF_REGEX = /^Si\s+(.+)\s+Entonces\s*$/i
export const ELSE_IF_REGEX = /^Sino\s+Si\s+(.+)\s+Entonces\s*$/i
export const FOR_REGEX =
  /^Para\s+([A-Za-z_][A-Za-z0-9_]*)\s*<-\s*(.+?)\s+Hasta\s+(.+?)(?:\s+Con\s+Paso\s+(.+?))?\s+Hacer\s*;?$/i
export const WHILE_REGEX = /^Mientras\s+(.+)\s+Hacer\s*;?$/i
export const REPEAT_REGEX = /^Repetir\s*;?$/i
export const UNTIL_REGEX = /^Hasta\s+Que\s+(.+)\s*;?$/i
export const SWITCH_REGEX = /^Segun\s+(.+)\s+Hacer\s*;?$/i
export const SWITCH_DEFAULT_REGEX = /^De\s+Otro\s+Modo\s*:?\s*$/i
export const SWITCH_CASE_REGEX = /^(.+)\s*:\s*$/
export const FUNCTION_HEADER_REGEX =
  /^Funcion\s+([A-Za-z_][A-Za-z0-9_]*)\s*<-\s*([A-Za-z_][A-Za-z0-9_]*)\s*\((.*)\)\s*$/i
export const SUBPROCESS_WITH_RETURN_HEADER_REGEX =
  /^SubProceso\s+([A-Za-z_][A-Za-z0-9_]*)\s*<-\s*([A-Za-z_][A-Za-z0-9_]*)\s*\((.*)\)\s*$/i
export const SUBPROCESS_HEADER_REGEX = /^SubProceso\s+([A-Za-z_][A-Za-z0-9_]*)(?:\((.*)\))?\s*$/i

export const OPERATOR_LEVELS: BinaryOperator[][] = [
  ['O'],
  ['Y'],
  ['>=', '<=', '==', '!=', '>', '<'],
  ['+', '-'],
  ['*', '/', '%'],
]

export interface SourceLine {
  line: number
  text: string
}

export interface ParserState {
  lines: SourceLine[]
  index: number
}

export class PseintParseError extends Error {
  readonly line?: number

  constructor(
    message: string,
    line?: number,
  ) {
    super(line ? `Linea ${line}: ${message}` : message)
    this.name = 'PseintParseError'
    this.line = line
  }
}

export function normalizeSource(source: string): SourceLine[] {
  return source
    .split(/\r?\n/)
    .map((line, index) => ({ line: index + 1, text: stripComments(line).trim() }))
    .filter((entry) => entry.text.length > 0)
}

function stripComments(line: string): string {
  const commentIndex = line.indexOf('//')
  if (commentIndex === -1) {
    return line
  }
  return line.slice(0, commentIndex)
}

export function normalizeVarType(typeName: string): PseintVarType {
  return typeName[0].toUpperCase() + typeName.slice(1).toLowerCase() as PseintVarType
}

export function matchesStopToken(currentText: string, stopTokens: string[]): boolean {
  for (const stopToken of stopTokens) {
    if (stopToken === currentText) {
      return true
    }

    if (stopToken === 'SinoSi' && ELSE_IF_REGEX.test(currentText)) {
      return true
    }

    if (stopToken === 'HastaQue' && UNTIL_REGEX.test(currentText)) {
      return true
    }

    if (stopToken === 'CasoSegun' && SWITCH_CASE_REGEX.test(currentText) && !SWITCH_DEFAULT_REGEX.test(currentText)) {
      return true
    }

    if (stopToken === 'DeOtroModo' && SWITCH_DEFAULT_REGEX.test(currentText)) {
      return true
    }
  }

  return false
}
