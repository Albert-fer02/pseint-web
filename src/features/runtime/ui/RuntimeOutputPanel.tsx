import { useMemo } from 'react'
import type { RuntimeExecution } from '@/entities/pseint/model/types'
import type { PseintErrorDescriptor } from '@/shared/lib/pseint/runtimeError'
import { getPseintErrorHint } from '@/shared/lib/pseint/errorHints'
import { RuntimeConsoleCard } from '@/features/runtime/ui/output/RuntimeConsoleCard'
import { RuntimeTraceControls } from '@/features/runtime/ui/output/RuntimeTraceControls'
import { RuntimeVariablesCard } from '@/features/runtime/ui/output/RuntimeVariablesCard'
import { getChangedVariableNames, formatTraceMarker } from '@/features/runtime/ui/output/runtimeOutputFormatters'
import { useRuntimeTracePlayback } from '@/features/runtime/ui/output/useRuntimeTracePlayback'

interface RuntimeOutputPanelProps {
  execution: RuntimeExecution | null
  error: PseintErrorDescriptor | null
  status: 'idle' | 'running' | 'success' | 'error'
}

export function RuntimeOutputPanel({ execution, error, status }: RuntimeOutputPanelProps) {
  const {
    boundedIndex,
    currentStep,
    previousStep,
    isPlaying,
    moveToStep,
    togglePlayback,
  } = useRuntimeTracePlayback(execution)

  const outputsToRender = currentStep?.outputs ?? execution?.outputs ?? []
  const variablesToRender = currentStep?.variables ?? execution?.variables ?? null
  const variableEntries = useMemo(() => Object.entries(variablesToRender ?? {}), [variablesToRender])
  const changedVariables = useMemo(
    () => getChangedVariableNames(previousStep?.variables ?? null, currentStep?.variables ?? null),
    [previousStep?.variables, currentStep?.variables],
  )
  const markerText = useMemo(() => formatTraceMarker(currentStep?.marker), [currentStep?.marker])

  if (status === 'running') {
    return (
      <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
        Ejecutando programa...
      </p>
    )
  }

  if (error) {
    const hint = error.hint ?? getPseintErrorHint(error.message)

    return (
      <div role="alert" className="space-y-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-destructive/90">
          {error.category} - {error.code}
        </p>
        <p className="text-sm text-destructive">{error.message}</p>
        {error.line ? <p className="text-xs text-destructive/90">Linea: {error.line}</p> : null}
        {error.context ? <p className="text-xs text-destructive/90">Contexto: {error.context}</p> : null}
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
      <RuntimeTraceControls
        execution={execution}
        boundedIndex={boundedIndex}
        currentStep={currentStep}
        markerText={markerText}
        isPlaying={isPlaying}
        onMoveToStep={moveToStep}
        onTogglePlayback={togglePlayback}
      />

      <RuntimeConsoleCard outputs={outputsToRender} />

      <RuntimeVariablesCard
        variableEntries={variableEntries}
        changedVariables={changedVariables}
        currentStepExists={Boolean(currentStep)}
      />
    </div>
  )
}
