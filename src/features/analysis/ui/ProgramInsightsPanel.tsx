import type { ProgramInsights } from '@/entities/pseint/model/types'
import { Badge } from '@/shared/ui/badge'

interface ProgramInsightsPanelProps {
  insights: ProgramInsights
}

export function ProgramInsightsPanel({ insights }: ProgramInsightsPanelProps) {
  const bandVariant = insights.complexityBand === 'Baja' ? 'secondary' : insights.complexityBand === 'Media' ? 'outline' : 'default'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">Nivel: {insights.estimatedLevel}</Badge>
        <Badge variant={bandVariant}>Complejidad: {insights.complexityBand}</Badge>
        <Badge variant="outline">Score: {insights.complexityScore}/10</Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-3">
        <MetricItem label="Lineas" value={String(insights.totalLines)} />
        <MetricItem label="Codigo" value={String(insights.codeLines)} />
        <MetricItem label="Comentarios" value={String(insights.commentLines)} />
        <MetricItem label="Variables" value={String(insights.declarationCount)} />
        <MetricItem label="Lecturas" value={String(insights.readCount)} />
        <MetricItem label="Escrituras" value={String(insights.writeCount)} />
        <MetricItem label="Asignaciones" value={String(insights.assignmentCount)} />
        <MetricItem label="Condicionales" value={String(insights.conditionalCount)} />
        <MetricItem label="Ciclos" value={String(insights.loopCount)} />
        <MetricItem label="Nesting max" value={String(insights.maxNesting)} />
        <MetricItem label="Ciclomatica" value={String(insights.cyclomaticComplexity)} />
      </div>

      <div className="rounded-lg border border-border bg-muted/35 p-3">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Complejidad temporal</p>
        <p className="text-sm text-foreground">{insights.timeComplexity}</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recomendaciones</p>
        <ul className="space-y-1 text-sm text-foreground">
          {insights.guidance.map((item) => (
            <li key={item}>- {item}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function MetricItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  )
}
