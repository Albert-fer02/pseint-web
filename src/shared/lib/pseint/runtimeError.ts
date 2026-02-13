import { getPseintErrorHint } from './errorHints'
import { PseintParseError } from './parserCore'

export type PseintErrorCategory = 'syntax' | 'runtime' | 'type' | 'logic' | 'input' | 'system'
export type PseintErrorSource = 'parser' | 'runtime' | 'system'

export interface PseintErrorDescriptor {
  code: string
  category: PseintErrorCategory
  source: PseintErrorSource
  message: string
  hint: string | null
  line: number | null
  context: string | null
}

interface PseintRuntimeErrorOptions {
  code?: string
  category?: PseintErrorCategory
  hint?: string | null
  line?: number | null
  context?: string | null
}

export class PseintRuntimeError extends Error {
  readonly code: string
  readonly category: PseintErrorCategory
  readonly hint: string | null
  readonly line: number | null
  readonly context: string | null

  constructor(message: string, options: PseintRuntimeErrorOptions = {}) {
    super(options.line ? `Linea ${options.line}: ${message}` : message)
    this.name = 'PseintRuntimeError'
    this.code = options.code ?? 'PS_RUNTIME_GENERIC'
    this.category = options.category ?? 'runtime'
    this.hint = options.hint ?? null
    this.line = options.line ?? null
    this.context = options.context ?? null
  }
}

export function toPseintErrorDescriptor(error: unknown): PseintErrorDescriptor {
  if (error instanceof PseintParseError) {
    return {
      code: 'PS_SYNTAX_PARSE',
      category: 'syntax',
      source: 'parser',
      message: error.message,
      hint: getPseintErrorHint(error.message),
      line: error.line ?? null,
      context: error.line ? `linea:${error.line}` : null,
    }
  }

  if (error instanceof PseintRuntimeError) {
    const inferred = inferRuntimeDescriptorFromMessage(error.message)
    const shouldUseInference =
      error.code === 'PS_RUNTIME_GENERIC'
      && error.category === 'runtime'
      && error.hint === null
      && error.context === null

    return {
      code: shouldUseInference ? inferred.code : error.code,
      category: shouldUseInference ? inferred.category : error.category,
      source: 'runtime',
      message: error.message,
      hint: error.hint ?? getPseintErrorHint(error.message) ?? inferred.hint,
      line: error.line,
      context: error.context ?? inferred.context,
    }
  }

  if (error instanceof Error) {
    const inferred = inferRuntimeDescriptorFromMessage(error.message)
    return {
      ...inferred,
      source: inferred.source,
      message: error.message,
      hint: getPseintErrorHint(error.message) ?? inferred.hint,
    }
  }

  return {
    code: 'PS_SYSTEM_UNKNOWN',
    category: 'system',
    source: 'system',
    message: 'Error desconocido de runtime.',
    hint: 'Vuelve a ejecutar y, si persiste, revisa la sintaxis y entradas del programa.',
    line: null,
    context: null,
  }
}

function inferRuntimeDescriptorFromMessage(message: string): Omit<PseintErrorDescriptor, 'message' | 'hint'> & { hint: string | null } {
  const trimmed = message.trim()

  const missingInput = trimmed.match(/Falta valor para la entrada "([^"]+)"\.?/i)
  if (missingInput) {
    return {
      code: 'PS_INPUT_MISSING',
      category: 'input',
      source: 'runtime',
      line: null,
      context: `entrada:${missingInput[1]}`,
      hint: `Completa la entrada "${missingInput[1]}" y vuelve a ejecutar.`,
    }
  }

  if (/Division por cero/i.test(trimmed)) {
    return {
      code: 'PS_RUNTIME_DIV_ZERO',
      category: 'logic',
      source: 'runtime',
      line: null,
      context: 'aritmetica',
      hint: 'Valida que el divisor sea distinto de 0 antes de dividir.',
    }
  }

  const undeclaredVariable = trimmed.match(/Variable no declarada:\s*([A-Za-z_][A-Za-z0-9_]*)/i)
  if (undeclaredVariable) {
    return {
      code: 'PS_RUNTIME_UNDECLARED_VARIABLE',
      category: 'runtime',
      source: 'runtime',
      line: null,
      context: `variable:${undeclaredVariable[1]}`,
      hint: `Declara "${undeclaredVariable[1]}" con Definir antes de usarla.`,
    }
  }

  if (/requiere un\s+(Entero|Real|Logico|Caracter)/i.test(trimmed)) {
    return {
      code: 'PS_TYPE_MISMATCH',
      category: 'type',
      source: 'runtime',
      line: null,
      context: null,
      hint: 'Revisa el tipo declarado y convierte la entrada al tipo esperado.',
    }
  }

  if (/Indice fuera de rango/i.test(trimmed)) {
    return {
      code: 'PS_RUNTIME_INDEX_RANGE',
      category: 'runtime',
      source: 'runtime',
      line: null,
      context: 'arreglo',
      hint: 'Asegurate de usar indices dentro del rango declarado del arreglo.',
    }
  }

  if (/Se supero el limite de iteraciones/i.test(trimmed)) {
    return {
      code: 'PS_RUNTIME_LOOP_LIMIT',
      category: 'logic',
      source: 'runtime',
      line: null,
      context: 'ciclo',
      hint: 'Verifica la condicion de salida del ciclo para evitar bucles infinitos.',
    }
  }

  if (/Sentencia no soportada|Funcion no soportada|Operador no soportado|Expresion no soportada/i.test(trimmed)) {
    return {
      code: 'PS_RUNTIME_UNSUPPORTED',
      category: 'runtime',
      source: 'runtime',
      line: null,
      context: 'compatibilidad',
      hint: 'Revisa la sintaxis usada; puede no estar implementada en esta version del interprete.',
    }
  }

  return {
    code: 'PS_RUNTIME_GENERIC',
    category: 'runtime',
    source: 'runtime',
    line: null,
    context: null,
    hint: null,
  }
}
