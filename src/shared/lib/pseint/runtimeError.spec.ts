import { describe, expect, it } from 'vitest'
import { PseintParseError } from '../../../shared/lib/pseint/parserCore'
import { PseintRuntimeError, toPseintErrorDescriptor } from './runtimeError'

describe('PseintRuntimeError', () => {
  describe('constructor', () => {
    it('creates basic error with message only', () => {
      const error = new PseintRuntimeError('Test error')

      expect(error.message).toBe('Test error')
      expect(error.code).toBe('PS_RUNTIME_GENERIC')
      expect(error.category).toBe('runtime')
      expect(error.hint).toBeNull()
      expect(error.line).toBeNull()
      expect(error.context).toBeNull()
    })

    it('includes line number in message when provided', () => {
      const error = new PseintRuntimeError('Test error', { line: 42 })

      expect(error.message).toBe('Linea 42: Test error')
      expect(error.line).toBe(42)
    })

    it('preserves custom metadata', () => {
      const error = new PseintRuntimeError('Custom error', {
        code: 'PS_CUSTOM',
        category: 'type',
        hint: 'Custom hint',
        line: 10,
        context: 'variable:x',
      })

      expect(error.code).toBe('PS_CUSTOM')
      expect(error.category).toBe('type')
      expect(error.hint).toBe('Custom hint')
      expect(error.line).toBe(10)
      expect(error.context).toBe('variable:x')
    })
  })
})

describe('toPseintErrorDescriptor', () => {
  describe('parser errors', () => {
    it('categorizes parser errors as syntax', () => {
      const descriptor = toPseintErrorDescriptor(new PseintParseError('Falta "FinSi".', 14))

      expect(descriptor.code).toBe('PS_SYNTAX_PARSE')
      expect(descriptor.category).toBe('syntax')
      expect(descriptor.source).toBe('parser')
      expect(descriptor.line).toBe(14)
      expect(descriptor.context).toBe('linea:14')
      expect(descriptor.hint).toContain('FinSi')
    })

    it('handles parser errors without line number', () => {
      const descriptor = toPseintErrorDescriptor(new PseintParseError('Syntax error'))

      expect(descriptor.code).toBe('PS_SYNTAX_PARSE')
      expect(descriptor.line).toBeNull()
      expect(descriptor.context).toBeNull()
    })
  })

  describe('runtime errors with explicit metadata', () => {
    it('preserves all metadata from runtime error', () => {
      const descriptor = toPseintErrorDescriptor(
        new PseintRuntimeError('Entrada invalida', {
          code: 'PS_INPUT_INVALID',
          category: 'input',
          context: 'entrada:edad',
          hint: 'Ingresa un entero valido.',
          line: 5,
        }),
      )

      expect(descriptor.code).toBe('PS_INPUT_INVALID')
      expect(descriptor.category).toBe('input')
      expect(descriptor.source).toBe('runtime')
      expect(descriptor.context).toBe('entrada:edad')
      expect(descriptor.hint).toBe('Ingresa un entero valido.')
      expect(descriptor.line).toBe(5)
    })
  })

  describe('runtime error inference', () => {
    it('infers missing input error', () => {
      const descriptor = toPseintErrorDescriptor(new Error('Falta valor para la entrada "edad".'))

      expect(descriptor.code).toBe('PS_INPUT_MISSING')
      expect(descriptor.category).toBe('input')
      expect(descriptor.context).toBe('entrada:edad')
      expect(descriptor.hint).toContain('edad')
    })

    it('infers division by zero error', () => {
      const descriptor = toPseintErrorDescriptor(new Error('Division por cero'))

      expect(descriptor.code).toBe('PS_RUNTIME_DIV_ZERO')
      expect(descriptor.category).toBe('logic')
      expect(descriptor.context).toBe('aritmetica')
      expect(descriptor.hint).toContain('divisor')
    })

    it('infers undeclared variable error', () => {
      const descriptor = toPseintErrorDescriptor(new Error('Variable no declarada: promedio'))

      expect(descriptor.code).toBe('PS_RUNTIME_UNDECLARED_VARIABLE')
      expect(descriptor.category).toBe('runtime')
      expect(descriptor.context).toBe('variable:promedio')
      expect(descriptor.hint).toContain('promedio')
      expect(descriptor.hint).toContain('Definir')
    })

    it('infers type mismatch error', () => {
      const descriptor = toPseintErrorDescriptor(new Error('La variable num1 requiere un Real'))

      expect(descriptor.code).toBe('PS_TYPE_MISMATCH')
      expect(descriptor.category).toBe('type')
      expect(descriptor.hint).toContain('tipo')
    })

    it('infers array index out of range error', () => {
      const descriptor = toPseintErrorDescriptor(new Error('Indice fuera de rango'))

      expect(descriptor.code).toBe('PS_RUNTIME_INDEX_RANGE')
      expect(descriptor.category).toBe('runtime')
      expect(descriptor.context).toBe('arreglo')
      expect(descriptor.hint).toContain('indices')
    })

    it('infers loop limit exceeded error', () => {
      const descriptor = toPseintErrorDescriptor(new Error('Se supero el limite de iteraciones'))

      expect(descriptor.code).toBe('PS_RUNTIME_LOOP_LIMIT')
      expect(descriptor.category).toBe('logic')
      expect(descriptor.context).toBe('ciclo')
      expect(descriptor.hint).toContain('bucles infinitos')
    })

    it('infers unsupported feature error', () => {
      const descriptor = toPseintErrorDescriptor(new Error('Sentencia no soportada'))

      expect(descriptor.code).toBe('PS_RUNTIME_UNSUPPORTED')
      expect(descriptor.category).toBe('runtime')
      expect(descriptor.context).toBe('compatibilidad')
    })

    it('returns generic descriptor for unknown error', () => {
      const descriptor = toPseintErrorDescriptor(new Error('Some unknown error message'))

      expect(descriptor.code).toBe('PS_RUNTIME_GENERIC')
      expect(descriptor.category).toBe('runtime')
      expect(descriptor.hint).toBeNull()
      expect(descriptor.context).toBeNull()
    })
  })

  describe('runtime error with fallback inference', () => {
    it('uses inference when runtime error has generic metadata', () => {
      const descriptor = toPseintErrorDescriptor(new PseintRuntimeError('Division por cero'))

      expect(descriptor.code).toBe('PS_RUNTIME_DIV_ZERO')
      expect(descriptor.category).toBe('logic')
      expect(descriptor.hint).toContain('divisor')
    })

    it('preserves explicit metadata over inference', () => {
      const descriptor = toPseintErrorDescriptor(
        new PseintRuntimeError('Division por cero', {
          code: 'PS_CUSTOM_DIV',
          category: 'type',
          hint: 'Custom hint',
        }),
      )

      expect(descriptor.code).toBe('PS_CUSTOM_DIV')
      expect(descriptor.category).toBe('type')
      expect(descriptor.hint).toBe('Custom hint')
    })
  })

  describe('unknown error types', () => {
    it('handles non-Error objects', () => {
      const descriptor = toPseintErrorDescriptor('string error')

      expect(descriptor.code).toBe('PS_SYSTEM_UNKNOWN')
      expect(descriptor.category).toBe('system')
      expect(descriptor.source).toBe('system')
      expect(descriptor.message).toBe('Error desconocido de runtime.')
    })

    it('handles null/undefined', () => {
      const descriptor = toPseintErrorDescriptor(null)

      expect(descriptor.code).toBe('PS_SYSTEM_UNKNOWN')
      expect(descriptor.category).toBe('system')
    })
  })

  describe('hint generation', () => {
    it('generates hint from error message via getPseintErrorHint', () => {
      const descriptor = toPseintErrorDescriptor(new Error('Variable no declarada: test'))

      expect(descriptor.hint).toContain('Declara "test"')
    })

    it('uses explicit hint over generated hint', () => {
      const descriptor = toPseintErrorDescriptor(
        new PseintRuntimeError('Variable no declarada: test', {
          hint: 'Custom hint',
        }),
      )

      expect(descriptor.hint).toBe('Custom hint')
    })

    it('falls back to inferred hint when no explicit hint', () => {
      const descriptor = toPseintErrorDescriptor(new PseintRuntimeError('Falta valor para la entrada "edad"'))

      expect(descriptor.hint).toContain('edad')
    })
  })

  describe('context extraction', () => {
    it('extracts variable name as context', () => {
      const descriptor = toPseintErrorDescriptor(new Error('Variable no declarada: myVar'))

      expect(descriptor.context).toBe('variable:myVar')
    })

    it('extracts input name as context', () => {
      const descriptor = toPseintErrorDescriptor(new Error('Falta valor para la entrada "inputName"'))

      expect(descriptor.context).toBe('entrada:inputName')
    })

    it('sets context for specific error categories', () => {
      const divZero = toPseintErrorDescriptor(new Error('Division por cero'))
      expect(divZero.context).toBe('aritmetica')

      const arrayError = toPseintErrorDescriptor(new Error('Indice fuera de rango'))
      expect(arrayError.context).toBe('arreglo')

      const loopError = toPseintErrorDescriptor(new Error('Se supero el limite de iteraciones'))
      expect(loopError.context).toBe('ciclo')
    })
  })

  describe('case insensitivity', () => {
    it('matches patterns regardless of case', () => {
      const lower = toPseintErrorDescriptor(new Error('division por cero'))
      const upper = toPseintErrorDescriptor(new Error('DIVISION POR CERO'))
      const mixed = toPseintErrorDescriptor(new Error('DiViSiOn PoR cErO'))

      expect(lower.code).toBe('PS_RUNTIME_DIV_ZERO')
      expect(upper.code).toBe('PS_RUNTIME_DIV_ZERO')
      expect(mixed.code).toBe('PS_RUNTIME_DIV_ZERO')
    })
  })

  describe('message preservation', () => {
    it('preserves original error message', () => {
      const originalMessage = 'Division por cero en la operacion x/y'
      const descriptor = toPseintErrorDescriptor(new Error(originalMessage))

      expect(descriptor.message).toBe(originalMessage)
    })

    it('preserves message with line number prefix', () => {
      const descriptor = toPseintErrorDescriptor(new PseintRuntimeError('Test error', { line: 10 }))

      expect(descriptor.message).toBe('Linea 10: Test error')
    })
  })

  describe('source attribution', () => {
    it('attributes parser errors to parser', () => {
      const descriptor = toPseintErrorDescriptor(new PseintParseError('Syntax error'))

      expect(descriptor.source).toBe('parser')
    })

    it('attributes runtime errors to runtime', () => {
      const descriptor = toPseintErrorDescriptor(new PseintRuntimeError('Runtime error'))

      expect(descriptor.source).toBe('runtime')
    })

    it('attributes generic errors to runtime via inference', () => {
      const descriptor = toPseintErrorDescriptor(new Error('Division por cero'))

      expect(descriptor.source).toBe('runtime')
    })

    it('attributes unknown errors to system', () => {
      const descriptor = toPseintErrorDescriptor({})

      expect(descriptor.source).toBe('system')
    })
  })
})
