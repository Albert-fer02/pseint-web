import { describe, expect, it } from 'vitest'
import { pseintCompletionItems } from '@/features/editor/model/pseintLanguage'

describe('pseintCompletionItems', () => {
  it('includes core keyword and function suggestions', () => {
    const labels = new Set(pseintCompletionItems.map((item) => item.label))

    expect(labels.has('escribir')).toBe(true)
    expect(labels.has('leer')).toBe(true)
    expect(labels.has('si')).toBe(true)
    expect(labels.has('concatenar')).toBe(true)
  })

  it('provides educational block snippets', () => {
    const paraSnippet = pseintCompletionItems.find((item) => item.label === 'para bloque')
    const siSnippet = pseintCompletionItems.find((item) => item.label === 'si bloque')

    expect(paraSnippet?.apply).toContain('FinPara')
    expect(siSnippet?.apply).toContain('FinSi')
  })
})
