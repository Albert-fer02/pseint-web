import type { ProgramInsights } from '@/entities/pseint/model/types'

export type AiProvider = 'gemini' | 'openai' | 'mock'
export type AiIssueSeverity = 'low' | 'medium' | 'high'

export interface AiTutorIssue {
  title: string
  severity: AiIssueSeverity
  explanation: string
  fixSuggestion: string
}

export interface AiTutorFeedback {
  summary: string
  complexityExplanation: string
  strengths: string[]
  issues: AiTutorIssue[]
  nextSteps: string[]
  nextExercise: string
}

export interface AiTutorInput {
  source: string
  parserError: string | null
  insights: ProgramInsights | null
}

export interface AiTutorResult {
  provider: AiProvider
  feedback: AiTutorFeedback
  fromCache: boolean
}

export interface AiProviderClient {
  provider: AiProvider
  generate(input: AiTutorInput): Promise<AiTutorFeedback>
}
