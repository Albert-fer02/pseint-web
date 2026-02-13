import { describe, expect, it } from 'vitest'
import { sanitizeRuntimeInputs } from './runtimeInputSanitizer'

describe('sanitizeRuntimeInputs', () => {
  it('keeps regular keys and values', () => {
    const result = sanitizeRuntimeInputs({ nombre: 'Ana', edad: '22' })

    expect(result.nombre).toBe('Ana')
    expect(result.edad).toBe('22')
  })

  it('drops prototype pollution keys', () => {
    const result = sanitizeRuntimeInputs({
      __proto__: 'x',
      constructor: 'y',
      prototype: 'z',
      nombre: 'Luis',
    } as Record<string, string>)

    expect(Object.keys(result)).toEqual(['nombre'])
    expect(result.nombre).toBe('Luis')
  })

  it('strips dangerous control and directional chars', () => {
    const result = sanitizeRuntimeInputs({
      ' nom\u0000bre ': 'Al\u202Eice\u0007',
    })

    expect(result.nombre).toBe('Alice')
  })
})
