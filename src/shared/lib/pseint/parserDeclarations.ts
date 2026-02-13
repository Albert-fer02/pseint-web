import type {
  FunctionParameter,
  ProgramConstant,
  ProgramDeclaration,
} from '../../../entities/pseint/model/types'
import {
  normalizeVarType,
  PseintParseError,
} from './parserCore'
import { parseExpression } from './parserExpressions'
import { splitTopLevel } from './parserUtils'

export function parseFunctionParameters(rawParameters: string, line: number): FunctionParameter[] {
  const trimmed = rawParameters.trim()
  if (!trimmed) {
    return []
  }

  return splitTopLevel(trimmed, ',').map((rawParameter) => parseFunctionParameter(rawParameter, line))
}

function parseFunctionParameter(rawParameter: string, line: number): FunctionParameter {
  let parameter = rawParameter.trim()
  let byReference = false

  const suffixByReferenceMatch = parameter.match(/^(.*?)\s+Por\s+Referencia$/i)
  if (suffixByReferenceMatch?.[1]) {
    byReference = true
    parameter = suffixByReferenceMatch[1].trim()
  }

  const prefixByReferenceMatch = parameter.match(/^Por\s+Referencia\s+(.+)$/i)
  if (prefixByReferenceMatch?.[1]) {
    byReference = true
    parameter = prefixByReferenceMatch[1].trim()
  }

  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(parameter)) {
    return {
      name: parameter,
      isArray: false,
      arrayRank: 0,
      byReference,
    }
  }

  const arrayMatch = parameter.match(/^([A-Za-z_][A-Za-z0-9_]*)\[(.*)\]$/)
  if (!arrayMatch?.[1] || arrayMatch[2] === undefined) {
    throw new PseintParseError(`Parametro de funcion invalido: "${rawParameter}"`, line)
  }

  const dimensionSpec = arrayMatch[2].trim()
  const rank = dimensionSpec ? dimensionSpec.split(',').length : 1

  return {
    name: arrayMatch[1],
    isArray: true,
    arrayRank: Math.max(1, rank),
    byReference: true,
  }
}

export function appendDeclarations(
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

function splitDeclarationNames(rawNames: string, line: number): Array<{ name: string; dimensions: number[] | null }> {
  const entries = splitTopLevel(rawNames, ',')
  if (!entries.length) {
    throw new PseintParseError('Declaracion Definir sin variables.', line)
  }

  return entries.map((entry) => parseDeclarationEntry(entry, line))
}

function parseDeclarationEntry(rawEntry: string, line: number): { name: string; dimensions: number[] | null } {
  const match = rawEntry.match(/^([A-Za-z_][A-Za-z0-9_]*)(?:\[\s*([^\]]+)\s*\])?$/)
  if (!match?.[1]) {
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

export function appendConstant(
  name: string,
  rawExpression: string,
  line: number,
  constants: ProgramConstant[],
  declaredNames: Set<string>,
): void {
  if (declaredNames.has(name)) {
    throw new PseintParseError(`Nombre ya declarado: "${name}"`, line)
  }

  constants.push({
    kind: 'constant',
    name,
    expression: parseExpression(rawExpression, line),
  })
  declaredNames.add(name)
}
