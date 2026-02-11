const INDENT_UNIT = '    '

const DEDENT_BEFORE_PATTERNS: RegExp[] = [
  /^finsi\b/i,
  /^finpara\b/i,
  /^finmientras\b/i,
  /^finalgoritmo\b/i,
  /^finfuncion\b/i,
  /^finsubproceso\b/i,
  /^sino\b/i,
  /^hasta\s+que\b/i,
]

const INDENT_AFTER_PATTERNS: RegExp[] = [
  /^si\b.*\bentonces\b/i,
  /^para\b.*\bhacer\b/i,
  /^mientras\b.*\bhacer\b/i,
  /^algoritmo\b/i,
  /^funcion\b/i,
  /^subproceso\b/i,
  /^repetir\b/i,
  /^sino\b/i,
]

export function formatPseintSource(source: string): string {
  const lines = source.replace(/\r\n/g, '\n').split('\n')
  const formattedLines: string[] = []
  let indentLevel = 0

  for (const rawLine of lines) {
    const trimmedLine = rawLine.trim()
    if (!trimmedLine.length) {
      formattedLines.push('')
      continue
    }

    if (matchesAny(trimmedLine, DEDENT_BEFORE_PATTERNS)) {
      indentLevel = Math.max(0, indentLevel - 1)
    }

    formattedLines.push(`${INDENT_UNIT.repeat(indentLevel)}${trimmedLine}`)

    if (matchesAny(trimmedLine, INDENT_AFTER_PATTERNS)) {
      indentLevel += 1
    }
  }

  return formattedLines.join('\n')
}

function matchesAny(value: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(value))
}
