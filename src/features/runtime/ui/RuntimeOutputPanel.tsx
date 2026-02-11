import type { RuntimeExecution } from '@/entities/pseint/model/types'

interface RuntimeOutputPanelProps {
  execution: RuntimeExecution | null
  error: string | null
  status: 'idle' | 'running' | 'success' | 'error'
}

export function RuntimeOutputPanel({ execution, error, status }: RuntimeOutputPanelProps) {
  if (status === 'running') {
    return <p className="text-sm text-muted-foreground">Ejecutando programa...</p>
  }

  if (error) {
    return (
      <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
    )
  }

  if (!execution) {
    return <p className="text-sm text-muted-foreground">Ejecuta el programa para ver la salida.</p>
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-muted/40 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Consola</p>
        <div className="space-y-1 font-mono text-sm text-foreground">
          {execution.outputs.map((line, index) => (
            <p key={`${line}-${index}`}>{line}</p>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Variables finales</p>
        <pre className="overflow-x-auto text-xs text-foreground/90">{JSON.stringify(execution.variables, null, 2)}</pre>
      </div>
    </div>
  )
}
