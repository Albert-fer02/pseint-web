import { useCallback, useRef, useState } from 'react'
import type { AiTutorInput, AiTutorResult } from '@/features/ai/model/types'
import { createDefaultAiOrchestrator } from '@/features/ai/lib/orchestrator'

const aiOrchestrator = createDefaultAiOrchestrator()

type AiTutorStatus = 'idle' | 'loading' | 'success' | 'error'

export function useAiTutor() {
  const [status, setStatus] = useState<AiTutorStatus>('idle')
  const [result, setResult] = useState<AiTutorResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const cache = useRef(new Map<string, AiTutorResult>())

  const analyze = useCallback(async (input: AiTutorInput) => {
    const key = createCacheKey(input)

    const cached = cache.current.get(key)
    if (cached) {
      setStatus('success')
      setResult({ ...cached, fromCache: true })
      setError(null)
      return
    }

    setStatus('loading')
    setError(null)

    try {
      const response = await aiOrchestrator.generate(input)
      const normalized: AiTutorResult = {
        provider: response.provider,
        feedback: response.feedback,
        fromCache: false,
      }
      cache.current.set(key, normalized)
      setResult(normalized)
      setStatus('success')
    } catch (runtimeError) {
      setResult(null)
      setStatus('error')
      setError(runtimeError instanceof Error ? runtimeError.message : 'No se pudo generar feedback de IA.')
    }
  }, [])

  return {
    analyze,
    status,
    result,
    error,
  }
}

function createCacheKey(input: AiTutorInput): string {
  const parserKey = input.parserError ?? ''
  const insightKey = input.insights
    ? `${input.insights.complexityScore}-${input.insights.statementCount}-${input.insights.maxNesting}`
    : 'no-insights'
  return `${hashString(input.source)}|${parserKey}|${insightKey}`
}

function hashString(text: string): string {
  let hash = 0
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(index)
    hash |= 0
  }
  return String(hash)
}
