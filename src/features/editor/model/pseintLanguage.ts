import { HighlightStyle, StreamLanguage, syntaxHighlighting } from '@codemirror/language'
import type { StreamParser } from '@codemirror/language'
import { tags } from '@lezer/highlight'

const KEYWORDS = new Set([
  'algoritmo',
  'finalgoritmo',
  'definir',
  'como',
  'leer',
  'escribir',
  'si',
  'entonces',
  'sino',
  'finsi',
  'mientras',
  'finmientras',
  'para',
  'finpara',
  'repetir',
  'hasta',
  'que',
])

const TYPES = new Set(['cadena', 'entero', 'real', 'logico', 'caracter'])
const FUNCTIONS = new Set(['subcadena', 'longitud', 'mayusculas', 'minusculas'])

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

    if (stream.match(/^(<-|>=|<=|==|!=|\+|-|\*|\/|>|<)/)) {
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
