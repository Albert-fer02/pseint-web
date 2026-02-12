import type {
  BinaryOperator,
  Expression,
  FunctionParameter,
  ProgramAst,
  ProgramDeclaration,
  ProgramFunction,
  PseintVarType,
  SegunCase,
  Statement,
  TargetRef,
} from '@/entities/pseint/model/types'

const DECLARATION_REGEX = /^Definir\s+(.+)\s+Como\s+(Cadena|Entero|Real|Logico|Caracter)\s*;?$/i
const READ_REGEX = /^Leer\s+(.+?)\s*;?$/i
const ASSIGNMENT_REGEX = /^(.+?)\s*<-\s*(.+?)\s*;?$/
const IF_REGEX = /^Si\s+(.+)\s+Entonces\s*$/i
const ELSE_IF_REGEX = /^Sino\s+Si\s+(.+)\s+Entonces\s*$/i
const FOR_REGEX =
  /^Para\s+([A-Za-z_][A-Za-z0-9_]*)\s*<-\s*(.+?)\s+Hasta\s+(.+?)(?:\s+Con\s+Paso\s+(.+?))?\s+Hacer\s*;?$/i
const WHILE_REGEX = /^Mientras\s+(.+)\s+Hacer\s*;?$/i
const REPEAT_REGEX = /^Repetir\s*;?$/i
const UNTIL_REGEX = /^Hasta\s+Que\s+(.+)\s*;?$/i
const SWITCH_REGEX = /^Segun\s+(.+)\s+Hacer\s*;?$/i
const SWITCH_DEFAULT_REGEX = /^De\s+Otro\s+Modo\s*:?\s*$/i
const SWITCH_CASE_REGEX = /^(.+)\s*:\s*$/
const FUNCTION_HEADER_REGEX =
  /^Funcion\s+([A-Za-z_][A-Za-z0-9_]*)\s*<-\s*([A-Za-z_][A-Za-z0-9_]*)\s*\((.*)\)\s*$/i

const OPERATOR_LEVELS: BinaryOperator[][] = [
  ['O'],
  ['Y'],
  ['>=', '<=', '==', '!=', '>', '<'],
  ['+', '-'],
  ['*', '/', '%'],
]

interface SourceLine {
  line: number
  text: string
}

interface ParserState {
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
  const declaredNames = new Set<string>()
  while (state.index < state.lines.length) {
    const current = state.lines[state.index]
    if (!current) {
      break
    }

    const match = current.text.match(DECLARATION_REGEX)
    if (!match) {
      break
    }

    appendDeclarations(match[1], match[2], current.line, declarations, declaredNames)
    state.index += 1
  }

  const statements = parseStatements(state, ['FinAlgoritmo'], declarations, declaredNames)
  const endLine = state.lines[state.index]
  if (!endLine || endLine.text !== 'FinAlgoritmo') {
    throw new PseintParseError('Falta "FinAlgoritmo" al final.')
  }

  state.index += 1

  const functions: ProgramFunction[] = []
  const functionNames = new Set<string>()

  while (state.index < state.lines.length) {
    const current = state.lines[state.index]
    if (!current) {
      break
    }

    if (!current.text.startsWith('Funcion ')) {
      throw createOutOfScopeStatementError(current)
    }

    const programFunction = parseFunction(state)
    if (functionNames.has(programFunction.name)) {
      throw new PseintParseError(`Funcion ya declarada: "${programFunction.name}"`, current.line)
    }

    functions.push(programFunction)
    functionNames.add(programFunction.name)
  }

  return {
    name: programName,
    declarations,
    statements,
    functions,
  }
}

function createOutOfScopeStatementError(line: SourceLine): PseintParseError {
  if (isLikelyExecutableStatement(line.text)) {
    return new PseintParseError(
      `La sentencia esta fuera de Algoritmo o Funcion: "${line.text}". Colocala antes de "FinAlgoritmo" o dentro de una "Funcion".`,
      line.line,
    )
  }

  return new PseintParseError(`Sentencia no soportada fuera de Algoritmo: "${line.text}"`, line.line)
}

function isLikelyExecutableStatement(text: string): boolean {
  if (ASSIGNMENT_REGEX.test(text)) {
    return true
  }

  return /^(Definir|Leer|Escribir|Si|Sino|Para|Mientras|Repetir|Segun)\b/i.test(text)
}

function parseFunction(state: ParserState): ProgramFunction {
  const headerLine = state.lines[state.index]
  if (!headerLine) {
    throw new PseintParseError('Definicion de funcion incompleta.')
  }

  const headerMatch = headerLine.text.match(FUNCTION_HEADER_REGEX)
  if (!headerMatch) {
    throw new PseintParseError('Cabecera de Funcion invalida.', headerLine.line)
  }

  const returnVariable = headerMatch[1]
  const functionName = headerMatch[2]
  const parameters = parseFunctionParameters(headerMatch[3], headerLine.line)

  state.index += 1

  const declarations: ProgramDeclaration[] = []
  const declaredNames = new Set<string>([returnVariable])

  for (const parameter of parameters) {
    if (declaredNames.has(parameter.name)) {
      throw new PseintParseError(`Parametro repetido en funcion: "${parameter.name}"`, headerLine.line)
    }
    declaredNames.add(parameter.name)
  }

  const statements = parseStatements(state, ['FinFuncion'], declarations, declaredNames)

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
    statements,
  }
}

function parseFunctionParameters(rawParameters: string, line: number): FunctionParameter[] {
  const trimmed = rawParameters.trim()
  if (!trimmed) {
    return []
  }

  return splitTopLevel(trimmed, ',').map((rawParameter) => parseFunctionParameter(rawParameter, line))
}

function parseFunctionParameter(rawParameter: string, line: number): FunctionParameter {
  const parameter = rawParameter.trim()

  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(parameter)) {
    return {
      name: parameter,
      isArray: false,
      arrayRank: 0,
    }
  }

  const arrayMatch = parameter.match(/^([A-Za-z_][A-Za-z0-9_]*)\[(.*)\]$/)
  if (!arrayMatch) {
    throw new PseintParseError(`Parametro de funcion invalido: "${rawParameter}"`, line)
  }

  const dimensionSpec = arrayMatch[2].trim()
  const rank = dimensionSpec ? dimensionSpec.split(',').length : 1

  return {
    name: arrayMatch[1],
    isArray: true,
    arrayRank: Math.max(1, rank),
  }
}

function parseStatements(
  state: ParserState,
  stopTokens: string[],
  declarations: ProgramDeclaration[],
  declaredNames: Set<string>,
): Statement[] {
  const statements: Statement[] = []

  while (state.index < state.lines.length) {
    const current = state.lines[state.index]
    if (!current) {
      break
    }

    if (matchesStopToken(current.text, stopTokens)) {
      break
    }

    if (current.text.startsWith('Definir ')) {
      const declarationMatch = current.text.match(DECLARATION_REGEX)
      if (!declarationMatch) {
        throw new PseintParseError('Sentencia Definir invalida.', current.line)
      }

      appendDeclarations(declarationMatch[1], declarationMatch[2], current.line, declarations, declaredNames)
      state.index += 1
      continue
    }

    if (current.text.startsWith('Leer ')) {
      const readMatch = current.text.match(READ_REGEX)
      if (!readMatch) {
        throw new PseintParseError('Sentencia Leer invalida.', current.line)
      }

      statements.push({ kind: 'read', target: parseTargetRef(readMatch[1], current.line) })
      state.index += 1
      continue
    }

    if (current.text.startsWith('Escribir ')) {
      let rawExpressionList = current.text.replace(/^Escribir\s+/, '').replace(/;\s*$/, '').trim()
      let noNewline = false

      const noNewlineMatch = rawExpressionList.match(/^(.*)\s+Sin\s+Saltar$/i)
      if (noNewlineMatch && noNewlineMatch[1]) {
        rawExpressionList = noNewlineMatch[1].trim()
        noNewline = true
      }

      if (!rawExpressionList) {
        throw new PseintParseError('Sentencia Escribir invalida.', current.line)
      }

      const expressions = splitTopLevel(rawExpressionList, ',').map((token) => parseExpression(token, current.line))
      statements.push({ kind: 'write', expressions, noNewline })
      state.index += 1
      continue
    }

    if (current.text.startsWith('Si ')) {
      const ifMatch = current.text.match(IF_REGEX)
      if (!ifMatch) {
        throw new PseintParseError('Sentencia Si invalida.', current.line)
      }

      state.index += 1
      const thenBranch = parseStatements(state, ['Sino', 'FinSi', 'SinoSi'], declarations, declaredNames)
      const elseBranch = parseElseBranch(state, current.line, declarations, declaredNames)

      const endIf = state.lines[state.index]
      if (!endIf || endIf.text !== 'FinSi') {
        throw new PseintParseError('Falta "FinSi" en bloque condicional.', current.line)
      }

      statements.push({
        kind: 'if',
        condition: parseExpression(ifMatch[1], current.line),
        thenBranch,
        elseBranch,
      })
      state.index += 1
      continue
    }

    if (current.text.startsWith('Para ')) {
      const forMatch = current.text.match(FOR_REGEX)
      if (!forMatch) {
        throw new PseintParseError('Sintaxis invalida en Para.', current.line)
      }

      state.index += 1
      const body = parseStatements(state, ['FinPara'], declarations, declaredNames)

      const endFor = state.lines[state.index]
      if (!endFor || endFor.text !== 'FinPara') {
        throw new PseintParseError('Falta "FinPara" en bloque Para.', current.line)
      }

      statements.push({
        kind: 'for',
        iterator: forMatch[1],
        start: parseExpression(forMatch[2], current.line),
        end: parseExpression(forMatch[3], current.line),
        step: parseExpression(forMatch[4] ?? '1', current.line),
        body,
      })
      state.index += 1
      continue
    }

    if (current.text.startsWith('Mientras ')) {
      const whileMatch = current.text.match(WHILE_REGEX)
      if (!whileMatch) {
        throw new PseintParseError('Sintaxis invalida en Mientras.', current.line)
      }

      state.index += 1
      const body = parseStatements(state, ['FinMientras'], declarations, declaredNames)

      const endWhile = state.lines[state.index]
      if (!endWhile || endWhile.text !== 'FinMientras') {
        throw new PseintParseError('Falta "FinMientras" en bloque Mientras.', current.line)
      }

      statements.push({
        kind: 'while',
        condition: parseExpression(whileMatch[1], current.line),
        body,
      })
      state.index += 1
      continue
    }

    if (REPEAT_REGEX.test(current.text)) {
      state.index += 1
      const body = parseStatements(state, ['HastaQue'], declarations, declaredNames)

      const untilLine = state.lines[state.index]
      if (!untilLine) {
        throw new PseintParseError('Falta "Hasta Que" en bloque Repetir.', current.line)
      }

      const untilMatch = untilLine.text.match(UNTIL_REGEX)
      if (!untilMatch) {
        throw new PseintParseError('Sintaxis invalida en "Hasta Que".', untilLine.line)
      }

      statements.push({
        kind: 'repeatUntil',
        body,
        condition: parseExpression(untilMatch[1], untilLine.line),
      })
      state.index += 1
      continue
    }

    if (current.text.startsWith('Segun ')) {
      const switchMatch = current.text.match(SWITCH_REGEX)
      if (!switchMatch) {
        throw new PseintParseError('Sintaxis invalida en Segun.', current.line)
      }

      state.index += 1
      const cases: SegunCase[] = []
      let defaultBranch: Statement[] = []

      while (state.index < state.lines.length) {
        const branchLine = state.lines[state.index]
        if (!branchLine) {
          break
        }

        if (branchLine.text === 'FinSegun') {
          break
        }

        if (SWITCH_DEFAULT_REGEX.test(branchLine.text)) {
          state.index += 1
          defaultBranch = parseStatements(state, ['FinSegun'], declarations, declaredNames)
          break
        }

        if (!SWITCH_CASE_REGEX.test(branchLine.text)) {
          throw new PseintParseError('Caso invalido en bloque Segun.', branchLine.line)
        }

        const caseValues = parseSegunCaseValues(branchLine.text, branchLine.line)
        state.index += 1
        const body = parseStatements(state, ['FinSegun', 'CasoSegun', 'DeOtroModo'], declarations, declaredNames)
        cases.push({
          values: caseValues,
          body,
        })
      }

      const endSwitch = state.lines[state.index]
      if (!endSwitch || endSwitch.text !== 'FinSegun') {
        throw new PseintParseError('Falta "FinSegun" en bloque Segun.', current.line)
      }

      statements.push({
        kind: 'switch',
        expression: parseExpression(switchMatch[1], current.line),
        cases,
        defaultBranch,
      })
      state.index += 1
      continue
    }

    const assignmentMatch = current.text.match(ASSIGNMENT_REGEX)
    if (assignmentMatch) {
      statements.push({
        kind: 'assign',
        target: parseTargetRef(assignmentMatch[1], current.line),
        expression: parseExpression(assignmentMatch[2], current.line),
      })
      state.index += 1
      continue
    }

    throw new PseintParseError(`Sentencia no soportada: "${current.text}"`, current.line)
  }

  return statements
}

function parseExpression(raw: string, line: number): Expression {
  const value = stripOuterParentheses(raw.trim())

  if (isQuoted(value)) {
    return { kind: 'literal', value: unquote(value) }
  }

  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return { kind: 'literal', value: Number(value) }
  }

  if (/^(Verdadero|Falso)$/i.test(value)) {
    return { kind: 'literal', value: /^Verdadero$/i.test(value) }
  }

  const notMatch = value.match(/^No\s+(.+)$/i)
  if (notMatch) {
    return {
      kind: 'unary',
      operator: 'NO',
      operand: parseExpression(notMatch[1], line),
    }
  }

  for (const operators of OPERATOR_LEVELS) {
    const operatorIndex = findOperatorRightToLeft(value, operators)
    if (!operatorIndex) {
      continue
    }

    const leftRaw = value.slice(0, operatorIndex.index)
    const rightRaw = value.slice(operatorIndex.index + operatorIndex.operator.length)

    if (!leftRaw.trim() || !rightRaw.trim()) {
      throw new PseintParseError('Expresion binaria incompleta.', line)
    }

    return {
      kind: 'binary',
      operator: operatorIndex.operator,
      left: parseExpression(leftRaw, line),
      right: parseExpression(rightRaw, line),
    }
  }

  const fnMatch = value.match(/^([A-Za-z_][A-Za-z0-9_]*)\((.*)\)$/)
  if (fnMatch) {
    const fnName = fnMatch[1]
    const rawArgs = fnMatch[2].trim()
    const args = rawArgs ? splitTopLevel(rawArgs, ',').map((arg) => parseExpression(arg, line)) : []
    return {
      kind: 'functionCall',
      name: fnName,
      args,
    }
  }

  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    return {
      kind: 'identifier',
      name: value,
    }
  }

  const arrayAccessMatch = value.match(/^([A-Za-z_][A-Za-z0-9_]*)\[(.+)\]$/)
  if (arrayAccessMatch) {
    const rawIndices = splitTopLevel(arrayAccessMatch[2], ',')
    if (rawIndices.length === 0) {
      throw new PseintParseError(`Acceso invalido a arreglo: "${value}"`, line)
    }

    return {
      kind: 'arrayElement',
      name: arrayAccessMatch[1],
      indices: rawIndices.map((rawIndex) => parseExpression(rawIndex, line)),
    }
  }

  throw new PseintParseError(`Expresion no reconocida: "${value}"`, line)
}

function parseElseBranch(
  state: ParserState,
  line: number,
  declarations: ProgramDeclaration[],
  declaredNames: Set<string>,
): Statement[] {
  const current = state.lines[state.index]
  if (!current) {
    throw new PseintParseError('Bloque Si sin cierre.', line)
  }

  if (current.text === 'Sino') {
    state.index += 1
    return parseStatements(state, ['FinSi'], declarations, declaredNames)
  }

  if (ELSE_IF_REGEX.test(current.text)) {
    return [parseElseIfChain(state, line, declarations, declaredNames)]
  }

  return []
}

function parseElseIfChain(
  state: ParserState,
  line: number,
  declarations: ProgramDeclaration[],
  declaredNames: Set<string>,
): Statement {
  const current = state.lines[state.index]
  if (!current) {
    throw new PseintParseError('Bloque Sino Si sin cierre.', line)
  }

  const elseIfMatch = current.text.match(ELSE_IF_REGEX)
  if (!elseIfMatch) {
    throw new PseintParseError('Sintaxis invalida en Sino Si.', current.line)
  }

  state.index += 1
  const thenBranch = parseStatements(state, ['Sino', 'FinSi', 'SinoSi'], declarations, declaredNames)
  const elseBranch = parseElseBranch(state, line, declarations, declaredNames)

  return {
    kind: 'if',
    condition: parseExpression(elseIfMatch[1], current.line),
    thenBranch,
    elseBranch,
  }
}

function parseSegunCaseValues(rawCaseLine: string, line: number): Expression[] {
  const match = rawCaseLine.match(SWITCH_CASE_REGEX)
  if (!match) {
    throw new PseintParseError(`Caso invalido en Segun: "${rawCaseLine}"`, line)
  }

  const rawValues = splitTopLevel(match[1], ',')
  if (!rawValues.length) {
    throw new PseintParseError('Un caso de Segun debe tener al menos un valor.', line)
  }

  return rawValues.map((rawValue) => parseExpression(rawValue, line))
}

function findOperatorRightToLeft(
  value: string,
  operators: BinaryOperator[],
): { index: number; operator: BinaryOperator } | null {
  let parenDepth = 0
  let bracketDepth = 0
  let inString = false

  for (let i = value.length - 1; i >= 0; i -= 1) {
    const char = value[i]

    if (char === '"') {
      inString = !inString
      continue
    }
    if (inString) {
      continue
    }

    if (char === ')') {
      parenDepth += 1
      continue
    }
    if (char === '(') {
      parenDepth -= 1
      continue
    }
    if (char === ']') {
      bracketDepth += 1
      continue
    }
    if (char === '[') {
      bracketDepth -= 1
      continue
    }
    if (parenDepth !== 0 || bracketDepth !== 0) {
      continue
    }

    for (const operator of operators) {
      const startIndex = i - operator.length + 1
      if (startIndex < 0) {
        continue
      }

      const token = value.slice(startIndex, i + 1)
      const normalizedToken = token.toUpperCase()
      const normalizedOperator = operator.toUpperCase()
      if (normalizedToken !== normalizedOperator) {
        continue
      }

      if ((operator === 'Y' || operator === 'O')) {
        const before = startIndex > 0 ? value[startIndex - 1] : ''
        const after = i + 1 < value.length ? value[i + 1] : ''
        if (isWordChar(before) || isWordChar(after)) {
          continue
        }
      }

      return { index: startIndex, operator }
    }
  }

  return null
}

function isWordChar(value: string): boolean {
  return /^[A-Za-z0-9_]$/.test(value)
}

function splitTopLevel(input: string, delimiter: ',' | ';'): string[] {
  const values: string[] = []
  let start = 0
  let parenDepth = 0
  let bracketDepth = 0
  let inString = false

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i]

    if (char === '"') {
      inString = !inString
      continue
    }
    if (inString) {
      continue
    }

    if (char === '(') {
      parenDepth += 1
      continue
    }
    if (char === ')') {
      parenDepth -= 1
      continue
    }
    if (char === '[') {
      bracketDepth += 1
      continue
    }
    if (char === ']') {
      bracketDepth -= 1
      continue
    }

    if (parenDepth === 0 && bracketDepth === 0 && char === delimiter) {
      values.push(input.slice(start, i).trim())
      start = i + 1
    }
  }

  values.push(input.slice(start).trim())
  return values.filter(Boolean)
}

function stripOuterParentheses(value: string): string {
  let text = value.trim()
  while (text.startsWith('(') && text.endsWith(')') && isFullyWrapped(text)) {
    text = text.slice(1, -1).trim()
  }
  return text
}

function isFullyWrapped(value: string): boolean {
  let depth = 0
  let inString = false

  for (let i = 0; i < value.length; i += 1) {
    const char = value[i]
    if (char === '"') {
      inString = !inString
      continue
    }
    if (inString) {
      continue
    }

    if (char === '(') {
      depth += 1
    } else if (char === ')') {
      depth -= 1
      if (depth === 0 && i < value.length - 1) {
        return false
      }
    }
  }

  return depth === 0
}

function normalizeSource(source: string): SourceLine[] {
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

function normalizeVarType(typeName: string): PseintVarType {
  return typeName[0].toUpperCase() + typeName.slice(1).toLowerCase() as PseintVarType
}

function splitDeclarationNames(rawNames: string, line: number): Array<{ name: string; dimensions: number[] | null }> {
  const entries = splitTopLevel(rawNames, ',')
  if (!entries.length) {
    throw new PseintParseError('Declaracion Definir sin variables.', line)
  }

  return entries.map((entry) => parseDeclarationEntry(entry, line))
}

function appendDeclarations(
  rawNames: string,
  rawVarType: string,
  line: number,
  declarations: ProgramDeclaration[],
  declaredNames: Set<string>,
): void {
  const varType = normalizeVarType(rawVarType)
  const declarationSpecs = splitDeclarationNames(rawNames, line)

  for (const declarationSpec of declarationSpecs) {
    if (declaredNames.has(declarationSpec.name)) {
      throw new PseintParseError(`Variable ya declarada: "${declarationSpec.name}"`, line)
    }

    declarations.push({
      kind: 'declaration',
      name: declarationSpec.name,
      varType,
      dimensions: declarationSpec.dimensions,
    })
    declaredNames.add(declarationSpec.name)
  }
}

function matchesStopToken(currentText: string, stopTokens: string[]): boolean {
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

function isQuoted(value: string): boolean {
  return value.startsWith('"') && value.endsWith('"')
}

function unquote(value: string): string {
  return value.slice(1, -1)
}

function parseDeclarationEntry(rawEntry: string, line: number): { name: string; dimensions: number[] | null } {
  const match = rawEntry.match(/^([A-Za-z_][A-Za-z0-9_]*)(?:\[\s*([^\]]+)\s*\])?$/)
  if (!match) {
    throw new PseintParseError(`Declaracion invalida: "${rawEntry}"`, line)
  }

  if (!match[2]) {
    return {
      name: match[1],
      dimensions: null,
    }
  }

  const rawDimensions = splitTopLevel(match[2], ',')
  if (!rawDimensions.length) {
    throw new PseintParseError(`Declaracion invalida de arreglo: "${rawEntry}"`, line)
  }

  const dimensions = rawDimensions.map((rawDimension) => {
    if (!/^\d+$/.test(rawDimension)) {
      throw new PseintParseError(`Dimension invalida: "${rawDimension}"`, line)
    }

    const dimension = Number(rawDimension)
    if (dimension <= 0) {
      throw new PseintParseError(`Dimension fuera de rango: "${rawDimension}"`, line)
    }

    return dimension
  })

  return {
    name: match[1],
    dimensions,
  }
}

function parseTargetRef(rawTarget: string, line: number): TargetRef {
  const target = rawTarget.trim()

  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(target)) {
    return { kind: 'variable', name: target }
  }

  const arrayAccessMatch = target.match(/^([A-Za-z_][A-Za-z0-9_]*)\[(.+)\]$/)
  if (arrayAccessMatch) {
    const rawIndices = splitTopLevel(arrayAccessMatch[2], ',')
    if (!rawIndices.length) {
      throw new PseintParseError(`Referencia de arreglo invalida: "${rawTarget}"`, line)
    }

    return {
      kind: 'arrayElement',
      name: arrayAccessMatch[1],
      indices: rawIndices.map((rawIndex) => parseExpression(rawIndex, line)),
    }
  }

  throw new PseintParseError(`Referencia de variable invalida: "${rawTarget}"`, line)
}
