import type { RuntimeValue } from '@/entities/pseint/model/types'
import { formatRuntimeValue } from './runtimeOutputFormatters'

interface RuntimeVariablesCardProps {
  variableEntries: Array<[string, RuntimeValue]>
  changedVariables: Set<string>
  currentStepExists: boolean
}

export function RuntimeVariablesCard({
  variableEntries,
  changedVariables,
  currentStepExists,
}: RuntimeVariablesCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {currentStepExists ? 'Variables del paso' : 'Variables finales'}
      </p>
      {variableEntries.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay variables declaradas en este estado.</p>
      ) : (
        <div className="max-h-64 space-y-2 overflow-auto">
          {variableEntries.map(([name, value]) => {
            const didChange = changedVariables.has(name)

            return (
              <div
                key={name}
                className={`rounded-md border p-2 ${didChange
                  ? 'border-emerald-500/60 bg-emerald-500/10'
                  : 'border-border bg-muted/15'
                }`}
              >
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {name}
                  {didChange ? ' (actualizada)' : ''}
                </p>
                <pre className="whitespace-pre-wrap break-words text-sm text-foreground/90 md:text-xs">
                  {formatRuntimeValue(value)}
                </pre>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
