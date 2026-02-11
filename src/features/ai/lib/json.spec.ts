import { describe, expect, it } from 'vitest'
import { safeParseJsonObject } from '@/features/ai/lib/json'

describe('safeParseJsonObject', () => {
  it('parses plain json', () => {
    const parsed = safeParseJsonObject('{"summary":"ok"}') as { summary: string }
    expect(parsed.summary).toBe('ok')
  })

  it('extracts json from markdown fences', () => {
    const parsed = safeParseJsonObject('```json\n{"summary":"ok"}\n```') as { summary: string }
    expect(parsed.summary).toBe('ok')
  })
})
