// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTERS_REGEX = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g
const DIRECTIONAL_CHARACTERS_REGEX = /[\u202A-\u202E\u2066-\u2069]/g
const MAX_INPUT_KEY_LENGTH = 160
const BLOCKED_INPUT_KEYS = new Set(['__proto__', 'prototype', 'constructor'])

export function sanitizeRuntimeInputs(rawInputs: Record<string, string>): Record<string, string> {
  const safeInputs = Object.create(null) as Record<string, string>

  if (!rawInputs || typeof rawInputs !== 'object') {
    return safeInputs
  }

  for (const [rawKey, rawValue] of Object.entries(rawInputs)) {
    const normalizedKey = sanitizeInputKey(rawKey)
    if (!normalizedKey) {
      continue
    }

    if (BLOCKED_INPUT_KEYS.has(normalizedKey.toLowerCase())) {
      continue
    }

    safeInputs[normalizedKey] = sanitizeInputValue(rawValue)
  }

  return safeInputs
}

function sanitizeInputKey(rawKey: string): string | null {
  if (typeof rawKey !== 'string') {
    return null
  }

  const normalized = stripDangerousCharacters(rawKey).trim()

  if (!normalized || normalized.length > MAX_INPUT_KEY_LENGTH) {
    return null
  }

  return normalized
}

function sanitizeInputValue(rawValue: unknown): string {
  const value = typeof rawValue === 'string' ? rawValue : String(rawValue ?? '')
  return stripDangerousCharacters(value)
}

function stripDangerousCharacters(value: string): string {
  return value.replace(CONTROL_CHARACTERS_REGEX, '').replace(DIRECTIONAL_CHARACTERS_REGEX, '')
}
