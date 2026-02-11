export function safeParseJsonObject(raw: string): unknown {
  const trimmed = raw.trim()
  if (!trimmed) {
    throw new Error('La respuesta de IA vino vacia.')
  }

  try {
    return JSON.parse(trimmed)
  } catch {
    const start = trimmed.indexOf('{')
    const end = trimmed.lastIndexOf('}')
    if (start === -1 || end === -1 || end <= start) {
      throw new Error('No se encontro JSON valido en la respuesta de IA.')
    }

    const extracted = trimmed.slice(start, end + 1)
    return JSON.parse(extracted)
  }
}
