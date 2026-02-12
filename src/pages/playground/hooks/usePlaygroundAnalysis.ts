import { useDeferredValue, useMemo } from 'react'
import { extractParserErrorLine } from '@/pages/playground/lib/playgroundRuntimeUtils'
import { extractInputFields } from '@/shared/lib/pseint/analyzer'
import { getPseintErrorHint } from '@/shared/lib/pseint/errorHints'
import { buildFlowchart } from '@/shared/lib/pseint/flowchart'
import { analyzeProgram } from '@/shared/lib/pseint/insights'
import { parseProgram } from '@/shared/lib/pseint/parser'
import type { ProgramInsights, RuntimeInputField } from '@/entities/pseint/model/types'

interface PlaygroundAnalysisSnapshot {
  inputFields: RuntimeInputField[]
  parserError: string | null
  parserHint: string | null
  parserErrorLine: number | null
  flowchartPreview: string | null
  insights: ProgramInsights | null
  isAnalysisPending: boolean
}

export function usePlaygroundAnalysis(source: string): PlaygroundAnalysisSnapshot {
  const deferredSource = useDeferredValue(source)

  const { inputFields, parserError, flowchartPreview, insights } = useMemo(() => {
    try {
      const ast = parseProgram(deferredSource)
      return {
        inputFields: extractInputFields(ast),
        parserError: null,
        flowchartPreview: buildFlowchart(ast),
        insights: analyzeProgram(deferredSource, ast),
      }
    } catch (parseError) {
      return {
        inputFields: [],
        parserError: parseError instanceof Error ? parseError.message : 'Error de parseo.',
        flowchartPreview: null,
        insights: null,
      }
    }
  }, [deferredSource])

  const parserHint = useMemo(() => (parserError ? getPseintErrorHint(parserError) : null), [parserError])
  const parserErrorLine = useMemo(() => extractParserErrorLine(parserError), [parserError])

  return {
    inputFields,
    parserError,
    parserHint,
    parserErrorLine,
    flowchartPreview,
    insights,
    isAnalysisPending: source !== deferredSource,
  }
}
