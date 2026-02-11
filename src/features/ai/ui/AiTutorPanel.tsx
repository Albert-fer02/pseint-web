import { useAiTutor } from '@/features/ai/hooks/useAiTutor'
import type { ProgramInsights } from '@/entities/pseint/model/types'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'

interface AiTutorPanelProps {
  source: string
  parserError: string | null
  insights: ProgramInsights | null
}

export function AiTutorPanel({ source, parserError, insights }: AiTutorPanelProps) {
  const { analyze, status, result, error } = useAiTutor()

  const runAnalysis = () => {
    void analyze({
      source,
      parserError,
      insights,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" onClick={runAnalysis} disabled={status === 'loading'}>
          {status === 'loading' ? 'Analizando...' : 'Analizar con IA'}
        </Button>
        <p className="text-xs text-muted-foreground">Gemini-first con fallback (OpenAI y mock local).</p>
      </div>

      {error ? <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

      {result ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Proveedor: {result.provider}</Badge>
            {result.fromCache ? <Badge variant="outline">cache</Badge> : null}
          </div>

          <div className="rounded-lg border border-border bg-muted/35 p-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resumen</p>
            <p className="text-sm text-foreground">{result.feedback.summary}</p>
          </div>

          <div className="rounded-lg border border-border bg-card p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fortalezas</p>
            <ul className="space-y-1 text-sm text-foreground">
              {result.feedback.strengths.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-border bg-card p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Puntos a mejorar</p>
            <ul className="space-y-2 text-sm text-foreground">
              {result.feedback.issues.length === 0 ? <li>- No se detectaron issues importantes.</li> : null}
              {result.feedback.issues.map((issue) => (
                <li key={`${issue.title}-${issue.severity}`} className="rounded-md border border-border p-2">
                  <p className="font-medium">
                    {issue.title} <span className="text-xs text-muted-foreground">({issue.severity})</span>
                  </p>
                  <p className="mt-1 text-sm text-foreground">{issue.explanation}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Sugerencia: {issue.fixSuggestion}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-border bg-card p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Siguientes pasos</p>
            <ul className="space-y-1 text-sm text-foreground">
              {result.feedback.nextSteps.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">Ejercicio recomendado: {result.feedback.nextExercise}</p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Solicita analisis para recibir feedback personalizado.</p>
      )}
    </div>
  )
}
