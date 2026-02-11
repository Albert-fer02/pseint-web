import type { AiTutorInput } from '@/features/ai/model/types'

export function buildTutorSystemPrompt(): string {
  return [
    'Eres un tutor senior de algoritmos para principiantes en PSeInt.',
    'Debes explicar en espanol simple, claro y accionable.',
    'No inventes errores: usa solo la evidencia del codigo y metricas.',
    'Devuelve solo JSON valido con el esquema solicitado.',
  ].join(' ')
}

export function buildTutorUserPrompt(input: AiTutorInput): string {
  return [
    'Analiza este pseudocodigo de PSeInt y entrega retroalimentacion pedagogica.',
    'Objetivo: ayudar a una estudiante principiante.',
    'Requisitos: detectar fortalezas, riesgos y sugerencias concretas.',
    'Usa severidad low/medium/high para issues.',
    '',
    'Esquema JSON esperado:',
    '{',
    '  "summary": string,',
    '  "complexityExplanation": string,',
    '  "strengths": string[],',
    '  "issues": [{"title": string, "severity": "low"|"medium"|"high", "explanation": string, "fixSuggestion": string}],',
    '  "nextSteps": string[],',
    '  "nextExercise": string',
    '}',
    '',
    `ParserError: ${input.parserError ?? 'none'}`,
    `Insights: ${JSON.stringify(input.insights ?? null)}`,
    '',
    'Codigo:',
    '```pseint',
    input.source,
    '```',
  ].join('\n')
}
