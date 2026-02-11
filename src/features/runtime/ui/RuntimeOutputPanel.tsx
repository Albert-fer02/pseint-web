import type { RuntimeExecution } from '@/entities/pseint/model/types'
import { getPseintErrorHint } from '@/shared/lib/pseint/errorHints'

interface RuntimeOutputPanelProps {
  execution: RuntimeExecution | null
  error: string | null
  status: 'idle' | 'running' | 'success' | 'error'
}

export function RuntimeOutputPanel({ execution, error, status }: RuntimeOutputPanelProps) {
  if (status === 'running') {
    return (
      <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
        Ejecutando programa...
      </p>
    )
  }

  if (error) {
    const hint = getPseintErrorHint(error)
    return (
      <div role="alert" className="space-y-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2">
        <p className="text-sm text-destructive">{error}</p>
        {hint ? <p className="text-xs text-destructive/90">Sugerencia: {hint}</p> : null}
      </div>
    )
  }

  if (!execution) {
    return (
      <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
        Ejecuta el programa para ver la salida.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-muted/40 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Consola</p>
        <div className="space-y-1 break-words font-mono text-sm text-foreground">
          {execution.outputs.map((line, index) => (
            <p key={`${line}-${index}`}>{line}</p>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Variables finales</p>
        <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words text-sm text-foreground/90 md:text-xs">
          {JSON.stringify(execution.variables, null, 2)}
        </pre>
      </div>
    </div>
  )
}
