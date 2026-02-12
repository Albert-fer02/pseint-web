import { autocompletion, completeFromList, type Completion } from '@codemirror/autocomplete'
import { HighlightStyle, StreamLanguage, syntaxHighlighting } from '@codemirror/language'
import type { StreamParser } from '@codemirror/language'
import { tags } from '@lezer/highlight'

const KEYWORDS = new Set([
  'algoritmo',
  'finalgoritmo',
  'definir',
  'constante',
  'como',
  'leer',
  'escribir',
  'funcion',
  'finfuncion',
  'subproceso',
  'finsubproceso',
  'por',
  'referencia',
  'si',
  'entonces',
  'sino',
  'finsi',
  'segun',
  'finsegun',
  'de',
  'otro',
  'modo',
  'mientras',
  'finmientras',
  'para',
  'con',
  'paso',
  'hacer',
  'finpara',
  'repetir',
  'hasta',
  'que',
  'sin',
  'saltar',
  'no',
  'y',
  'o',
])

const TYPES = new Set(['cadena', 'entero', 'real', 'logico', 'caracter'])
const FUNCTIONS = new Set(['subcadena', 'longitud', 'mayusculas', 'minusculas', 'concatenar'])

const completionItems: Completion[] = [
  ...Array.from(KEYWORDS).map((keyword) => ({
    label: keyword,
    type: 'keyword',
    apply: keyword[0]?.toUpperCase() + keyword.slice(1),
  })),
  ...Array.from(TYPES).map((typeName) => ({
    label: typeName,
    type: 'type',
    apply: typeName[0]?.toUpperCase() + typeName.slice(1),
  })),
  ...Array.from(FUNCTIONS).map((fn) => ({
    label: fn,
    type: 'function',
    apply: `${fn[0]?.toUpperCase() + fn.slice(1)}()`,
  })),
  {
    label: 'si bloque',
    type: 'keyword',
    detail: 'bloque condicional',
    apply: 'Si  Entonces\n    \nFinSi',
  },
  {
    label: 'si-sino bloque',
    type: 'keyword',
    detail: 'bloque condicional completo',
    apply: 'Si  Entonces\n    \nSino\n    \nFinSi',
  },
  {
    label: 'para bloque',
    type: 'keyword',
    detail: 'ciclo para',
    apply: 'Para i <- 1 Hasta 10 Con Paso 1 Hacer\n    \nFinPara',
  },
  {
    label: 'mientras bloque',
    type: 'keyword',
    detail: 'ciclo mientras',
    apply: 'Mientras  Hacer\n    \nFinMientras',
  },
  {
    label: 'definir ejemplo',
    type: 'keyword',
    detail: 'declarar variable',
    apply: 'Definir variable Como Entero;',
  },
  {
    label: 'escribir ejemplo',
    type: 'keyword',
    detail: 'salida por consola',
    apply: 'Escribir "";',
  },
  {
    label: 'leer ejemplo',
    type: 'keyword',
    detail: 'entrada de usuario',
    apply: 'Leer variable;',
  },
]

const parser: StreamParser<null> = {
  token(stream) {
    if (stream.eatSpace()) {
      return null
    }

    if (stream.match('//')) {
      stream.skipToEnd()
      return 'comment'
    }

    if (stream.match('"')) {
      while (!stream.eol()) {
        if (stream.next() === '"') {
          break
        }
      }
      return 'string'
    }

    if (stream.match(/^(Verdadero|Falso)\b/i)) {
      return 'atom'
    }

    if (stream.match(/^\d+(\.\d+)?/)) {
      return 'number'
    }

    if (stream.match(/^(<-|>=|<=|==|!=|\+|-|\*|\/|%|>|<)/)) {
      return 'operator'
    }

    if (stream.match(/^[(),;:]/)) {
      return 'punctuation'
    }

    if (stream.match(/^[A-Za-z_][A-Za-z0-9_]*/)) {
      const token = stream.current().toLowerCase()
      if (KEYWORDS.has(token)) {
        return 'keyword'
      }
      if (TYPES.has(token)) {
        return 'typeName'
      }
      if (FUNCTIONS.has(token)) {
        return 'function'
      }
      return 'variableName'
    }

    stream.next()
    return null
  },
}

export const pseintLanguage = StreamLanguage.define(parser)
export const pseintAutocompletion = autocompletion({
  override: [completeFromList(completionItems)],
  activateOnTyping: true,
  maxRenderedOptions: 14,
})

export const pseintHighlighting = syntaxHighlighting(
  HighlightStyle.define([
    { tag: tags.keyword, color: 'var(--syntax-keyword)', fontWeight: '700' },
    { tag: tags.typeName, color: 'var(--syntax-type)', fontWeight: '600' },
    { tag: tags.function(tags.variableName), color: 'var(--syntax-function)', fontWeight: '600' },
    { tag: tags.string, color: 'var(--syntax-string)' },
    { tag: tags.number, color: 'var(--syntax-number)' },
    { tag: tags.bool, color: 'var(--syntax-boolean)', fontWeight: '700' },
    { tag: tags.comment, color: 'var(--syntax-comment)', fontStyle: 'italic' },
    { tag: tags.operator, color: 'var(--syntax-operator)', fontWeight: '600' },
    { tag: tags.variableName, color: 'var(--syntax-variable)' },
  ]),
)
