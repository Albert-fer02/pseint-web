import type {
  ProgramConstant,
  ProgramDeclaration,
  SegunCase,
  Statement,
} from '@/entities/pseint/model/types'
import {
  ASSIGNMENT_REGEX,
  CALL_REGEX,
  CONSTANT_REGEX,
  DECLARATION_REGEX,
  ELSE_IF_REGEX,
  FOR_REGEX,
  IF_REGEX,
  matchesStopToken,
  PseintParseError,
  READ_REGEX,
  REPEAT_REGEX,
  SWITCH_DEFAULT_REGEX,
  SWITCH_REGEX,
  SWITCH_CASE_REGEX,
  UNTIL_REGEX,
  WHILE_REGEX,
} from '@/shared/lib/pseint/parserCore'
import type { ParserState } from '@/shared/lib/pseint/parserCore'
import {
  appendConstant,
  appendDeclarations,
} from '@/shared/lib/pseint/parserDeclarations'
import {
  parseExpression,
  parseSegunCaseValues,
  parseTargetRef,
} from '@/shared/lib/pseint/parserExpressions'
import { splitTopLevel } from '@/shared/lib/pseint/parserUtils'

export function parseStatements(
  state: ParserState,
  stopTokens: string[],
  declarations: ProgramDeclaration[],
  constants: ProgramConstant[],
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
      if (!declarationMatch?.[1] || !declarationMatch[2]) {
        throw new PseintParseError('Sentencia Definir invalida.', current.line)
      }

      appendDeclarations(declarationMatch[1], declarationMatch[2], current.line, declarations, declaredNames)
      state.index += 1
      continue
    }

    if (current.text.startsWith('Constante ')) {
      const constantMatch = current.text.match(CONSTANT_REGEX)
      if (!constantMatch?.[1] || !constantMatch[2]) {
        throw new PseintParseError('Sentencia Constante invalida.', current.line)
      }

      appendConstant(constantMatch[1], constantMatch[2], current.line, constants, declaredNames)
      state.index += 1
      continue
    }

    if (current.text.startsWith('Leer ')) {
      const readMatch = current.text.match(READ_REGEX)
      if (!readMatch?.[1]) {
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
      if (noNewlineMatch?.[1]) {
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
      if (!ifMatch?.[1]) {
        throw new PseintParseError('Sentencia Si invalida.', current.line)
      }

      state.index += 1
      const thenBranch = parseStatements(state, ['Sino', 'FinSi', 'SinoSi'], declarations, constants, declaredNames)
      const elseBranch = parseElseBranch(state, current.line, declarations, constants, declaredNames)

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
      if (!forMatch?.[1] || !forMatch[2] || !forMatch[3]) {
        throw new PseintParseError('Sintaxis invalida en Para.', current.line)
      }

      state.index += 1
      const body = parseStatements(state, ['FinPara'], declarations, constants, declaredNames)

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
      if (!whileMatch?.[1]) {
        throw new PseintParseError('Sintaxis invalida en Mientras.', current.line)
      }

      state.index += 1
      const body = parseStatements(state, ['FinMientras'], declarations, constants, declaredNames)

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
      const body = parseStatements(state, ['HastaQue'], declarations, constants, declaredNames)

      const untilLine = state.lines[state.index]
      if (!untilLine) {
        throw new PseintParseError('Falta "Hasta Que" en bloque Repetir.', current.line)
      }

      const untilMatch = untilLine.text.match(UNTIL_REGEX)
      if (!untilMatch?.[1]) {
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
      if (!switchMatch?.[1]) {
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
          defaultBranch = parseStatements(state, ['FinSegun'], declarations, constants, declaredNames)
          break
        }

        if (!SWITCH_CASE_REGEX.test(branchLine.text)) {
          throw new PseintParseError('Caso invalido en bloque Segun.', branchLine.line)
        }

        const caseValues = parseSegunCaseValues(branchLine.text, branchLine.line)
        state.index += 1
        const body = parseStatements(state, ['FinSegun', 'CasoSegun', 'DeOtroModo'], declarations, constants, declaredNames)
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
    if (assignmentMatch?.[1] && assignmentMatch[2]) {
      statements.push({
        kind: 'assign',
        target: parseTargetRef(assignmentMatch[1], current.line),
        expression: parseExpression(assignmentMatch[2], current.line),
      })
      state.index += 1
      continue
    }

    const callMatch = current.text.match(CALL_REGEX)
    if (callMatch?.[1]) {
      const rawArgs = callMatch[2]?.trim() ?? ''
      const args = rawArgs ? splitTopLevel(rawArgs, ',').map((token) => parseExpression(token, current.line)) : []

      statements.push({
        kind: 'call',
        name: callMatch[1],
        args,
      })
      state.index += 1
      continue
    }

    throw new PseintParseError(`Sentencia no soportada: "${current.text}"`, current.line)
  }

  return statements
}

function parseElseBranch(
  state: ParserState,
  line: number,
  declarations: ProgramDeclaration[],
  constants: ProgramConstant[],
  declaredNames: Set<string>,
): Statement[] {
  const current = state.lines[state.index]
  if (!current) {
    throw new PseintParseError('Bloque Si sin cierre.', line)
  }

  if (current.text === 'Sino') {
    state.index += 1
    return parseStatements(state, ['FinSi'], declarations, constants, declaredNames)
  }

  if (ELSE_IF_REGEX.test(current.text)) {
    return [parseElseIfChain(state, line, declarations, constants, declaredNames)]
  }

  return []
}

function parseElseIfChain(
  state: ParserState,
  line: number,
  declarations: ProgramDeclaration[],
  constants: ProgramConstant[],
  declaredNames: Set<string>,
): Statement {
  const current = state.lines[state.index]
  if (!current) {
    throw new PseintParseError('Bloque Sino Si sin cierre.', line)
  }

  const elseIfMatch = current.text.match(ELSE_IF_REGEX)
  if (!elseIfMatch?.[1]) {
    throw new PseintParseError('Sintaxis invalida en Sino Si.', current.line)
  }

  state.index += 1
  const thenBranch = parseStatements(state, ['Sino', 'FinSi', 'SinoSi'], declarations, constants, declaredNames)
  const elseBranch = parseElseBranch(state, line, declarations, constants, declaredNames)

  return {
    kind: 'if',
    condition: parseExpression(elseIfMatch[1], current.line),
    thenBranch,
    elseBranch,
  }
}
