import type { AiProvider, AiProviderClient, AiTutorFeedback, AiTutorInput } from '@/features/ai/model/types'
import { safeParseJsonObject } from '@/features/ai/lib/json'
import { buildTutorSystemPrompt, buildTutorUserPrompt } from '@/features/ai/lib/prompt'
import { aiTutorFeedbackSchema } from '@/features/ai/lib/schema'

interface CompletionConfig {
  provider: Exclude<AiProvider, 'mock'>
  apiKey: string
  endpoint: string
  model: string
}

const DEFAULT_TIMEOUT_MS = 18000

export class AiOrchestrator {
  private readonly clients: AiProviderClient[]

  constructor(clients: AiProviderClient[]) {
    this.clients = clients
  }

  async generate(input: AiTutorInput): Promise<{ provider: AiProvider; feedback: AiTutorFeedback }> {
    const errors: string[] = []

    for (const client of this.clients) {
      try {
        const feedback = await client.generate(input)
        return { provider: client.provider, feedback }
      } catch (error) {
        errors.push(`${client.provider}: ${error instanceof Error ? error.message : 'error desconocido'}`)
      }
    }

    throw new Error(`No se pudo generar feedback de IA. Intentos: ${errors.join(' | ')}`)
  }
}

export function createDefaultAiOrchestrator(): AiOrchestrator {
  const clients: AiProviderClient[] = []

  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined

  if (geminiKey) {
    clients.push(
      createHttpProvider({
        provider: 'gemini',
        apiKey: geminiKey,
        endpoint: (import.meta.env.VITE_GEMINI_BASE_URL as string | undefined) ??
          'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
        model: (import.meta.env.VITE_GEMINI_MODEL as string | undefined) ?? 'gemini-2.5-flash',
      }),
    )
  }

  if (openaiKey) {
    clients.push(
      createHttpProvider({
        provider: 'openai',
        apiKey: openaiKey,
        endpoint: (import.meta.env.VITE_OPENAI_BASE_URL as string | undefined) ?? 'https://api.openai.com/v1/chat/completions',
        model: (import.meta.env.VITE_OPENAI_MODEL as string | undefined) ?? 'gpt-5-mini',
      }),
    )
  }

  clients.push(createMockProvider())
  return new AiOrchestrator(clients)
}

function createHttpProvider(config: CompletionConfig): AiProviderClient {
  return {
    provider: config.provider,
    async generate(input) {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)

      try {
        const response = await fetch(config.endpoint, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({
            model: config.model,
            temperature: 0.2,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: buildTutorSystemPrompt() },
              { role: 'user', content: buildTutorUserPrompt(input) },
            ],
          }),
        })

        if (!response.ok) {
          const text = await response.text()
          throw new Error(`HTTP ${response.status}: ${text.slice(0, 220)}`)
        }

        const raw = (await response.json()) as {
          choices?: Array<{ message?: { content?: string } }>
        }

        const content = raw.choices?.[0]?.message?.content
        if (!content) {
          throw new Error('El proveedor no devolvio contenido util.')
        }

        const parsed = safeParseJsonObject(content)
        return aiTutorFeedbackSchema.parse(parsed)
      } finally {
        clearTimeout(timeout)
      }
    },
  }
}

function createMockProvider(): AiProviderClient {
  return {
    provider: 'mock',
    async generate(input) {
      const parserIssue = input.parserError
      const level = input.insights?.estimatedLevel ?? 'Basico'
      const complexity = input.insights?.complexityBand ?? 'Baja'

      return {
        summary: parserIssue
          ? 'Hay un error de parseo; primero corrige la sintaxis para analizar mejor el algoritmo.'
          : `El algoritmo se ve de nivel ${level} con complejidad ${complexity}.`,
        complexityExplanation: input.insights?.timeComplexity ?? 'Sin datos de complejidad.',
        strengths: parserIssue
          ? ['Intentaste estructurar el algoritmo con bloques claros.']
          : ['Declaraciones claras al inicio.', 'Uso de condicional para separar casos.', 'Salida legible para la persona usuaria.'],
        issues: parserIssue
          ? [
              {
                title: 'Error de parseo',
                severity: 'high',
                explanation: parserIssue,
                fixSuggestion: 'Revisa la linea indicada y verifica cierre de bloques y sintaxis de sentencias.',
              },
            ]
          : [
              {
                title: 'Validaciones de entrada faltantes',
                severity: 'medium',
                explanation: 'No todos los casos borde de entrada estan controlados.',
                fixSuggestion: 'Agrega validaciones para datos vacios, tipos invalidos y rangos imposibles.',
              },
            ],
        nextSteps: parserIssue
          ? ['Corregir el parseo.', 'Ejecutar de nuevo y revisar complejidad.']
          : ['Agregar validaciones de entrada.', 'Probar casos borde.', 'Extraer bloques reutilizables en subalgoritmos.'],
        nextExercise:
          'Crea una version que pida nota1, nota2 y nota3, calcule promedio y clasifique: desaprobado, regular o promocionado.',
      }
    },
  }
}
