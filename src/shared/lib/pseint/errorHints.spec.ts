import { describe, expect, it } from 'vitest'
import { getPseintErrorHint } from '@/shared/lib/pseint/errorHints'

describe('getPseintErrorHint', () => {
  it('returns specific hint for undeclared variable', () => {
    const hint = getPseintErrorHint('Variable no declarada: promedio')
    expect(hint).toContain('Declara "promedio"')
  })

  it('returns specific hint for missing input', () => {
    const hint = getPseintErrorHint('Falta valor para la entrada "edad".')
    expect(hint).toContain('edad')
  })

  it('returns null when no rule matches', () => {
    const hint = getPseintErrorHint('Mensaje desconocido totalmente distinto')
    expect(hint).toBeNull()
  })
})
