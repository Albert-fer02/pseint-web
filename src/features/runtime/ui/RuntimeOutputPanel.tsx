import { useEffect, useMemo, useState } from 'react'
import type { RuntimeExecution, RuntimeValue } from '@/entities/pseint/model/types'
import { getPseintErrorHint } from '@/shared/lib/pseint/errorHints'
import { Button } from '@/shared/ui/button'

interface RuntimeOutputPanelProps {
  execution: RuntimeExecution | null
  error: string | null
  status: 'idle' | 'running' | 'success' | 'error'
}

const STEP_PLAYBACK_INTERVAL_MS = 700

export function RuntimeOutputPanel({ execution, error, status }: RuntimeOutputPanelProps) {
  const [traceCursor, setTraceCursor] = useState<{ version: string; index: number }>({
    version: 'none',
    index: 0,
  })
  const [playback, setPlayback] = useState<{ version: string; active: boolean }>({
    version: 'none',
    active: false,
  })

  const traceVersion = execution
    ? `${execution.stepsExecuted}:${execution.trace.length}:${execution.outputs.length}`
    : 'none'
  const traceLength = execution?.trace.length ?? 0
  const fallbackIndex = Math.max(0, traceLength - 1)

  const activeStepIndex = execution
    ? traceCursor.version === traceVersion
      ? traceCursor.index
      : fallbackIndex
    : 0

  const boundedIndex = execution
    ? Math.min(Math.max(activeStepIndex, 0), fallbackIndex)
    : 0
  const currentStep = execution?.trace[boundedIndex] ?? null
  const previousStep = execution?.trace[boundedIndex - 1] ?? null
  const outputsToRender = currentStep?.outputs ?? execution?.outputs ?? []
  const variablesToRender = currentStep?.variables ?? execution?.variables ?? null
  const variableEntries = useMemo(() => Object.entries(variablesToRender ?? {}), [variablesToRender])
  const changedVariables = useMemo(
    () => getChangedVariableNames(previousStep?.variables ?? null, currentStep?.variables ?? null),
    [previousStep?.variables, currentStep?.variables],
  )
  const markerText = useMemo(() => formatTraceMarker(currentStep?.marker), [currentStep?.marker])
  const isPlaying = playback.active && playback.version === traceVersion

  useEffect(() => {
    if (!execution || !isPlaying || traceLength === 0 || boundedIndex >= traceLength - 1) {
      return
    }

    const timerId = window.setInterval(() => {
      setTraceCursor((previousCursor) => {
        const previousIndex = previousCursor.version === traceVersion ? previousCursor.index : boundedIndex
        const nextIndex = Math.min(traceLength - 1, previousIndex + 1)

        if (nextIndex >= traceLength - 1) {
          setPlayback({ version: traceVersion, active: false })
        }

        return {
          version: traceVersion,
          index: nextIndex,
        }
      })
    }, STEP_PLAYBACK_INTERVAL_MS)

    return () => window.clearInterval(timerId)
  }, [execution, isPlaying, traceLength, boundedIndex, traceVersion])

  const moveToStep = (nextIndex: number) => {
    if (!execution || traceLength === 0) {
      return
    }

    const clampedIndex = Math.min(Math.max(nextIndex, 0), traceLength - 1)
    setTraceCursor({ version: traceVersion, index: clampedIndex })
    setPlayback({ version: traceVersion, active: false })
  }

  const togglePlayback = () => {
    if (!execution || traceLength === 0) {
      return
    }

    if (isPlaying) {
      setPlayback({ version: traceVersion, active: false })
      return
    }

    const startIndex = boundedIndex >= traceLength - 1 ? 0 : boundedIndex
    setTraceCursor({ version: traceVersion, index: startIndex })
    setPlayback({ version: traceVersion, active: true })
  }

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
      {currentStep ? (
        <div className="space-y-2 rounded-xl border border-border bg-card p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Paso a paso ({boundedIndex + 1}/{execution.trace.length})
            </p>
            <div className="text-right text-xs text-muted-foreground">
              <p>{markerText}</p>
              <p>Paso motor: {currentStep.stepNumber}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => moveToStep(boundedIndex - 1)}
              disabled={boundedIndex <= 0}
            >
              Anterior
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => moveToStep(boundedIndex + 1)}
              disabled={boundedIndex >= execution.trace.length - 1}
            >
              Siguiente
            </Button>
            <Button
              type="button"
              size="sm"
              variant={isPlaying ? 'secondary' : 'outline'}
              onClick={togglePlayback}
            >
              {isPlaying ? 'Pausar' : 'Reproducir'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => moveToStep(execution.trace.length - 1)}
              disabled={boundedIndex >= execution.trace.length - 1}
            >
              Ir al final
            </Button>
          </div>
          {execution.traceTruncated ? (
            <p className="text-xs text-muted-foreground">
              La traza se recorto por limite de pasos para mantener rendimiento.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-xl border border-border bg-muted/40 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Consola</p>
        <div className="space-y-1 break-words font-mono text-sm text-foreground">
          {outputsToRender.map((line, index) => (
            <p key={`${line}-${index}`}>{line}</p>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {currentStep ? 'Variables del paso' : 'Variables finales'}
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
    </div>
  )
}

function formatTraceMarker(marker: RuntimeExecution['trace'][number]['marker'] | undefined): string {
  if (!marker) {
    return 'Sin traza'
  }

  if (marker === 'start') {
    return 'Inicio'
  }

  if (marker === 'finish') {
    return 'Fin'
  }

  if (marker === 'read') {
    return 'Sentencia: Leer'
  }
  if (marker === 'write') {
    return 'Sentencia: Escribir'
  }
  if (marker === 'assign') {
    return 'Sentencia: Asignacion'
  }
  if (marker === 'call') {
    return 'Sentencia: Llamada'
  }
  if (marker === 'if') {
    return 'Sentencia: Si'
  }
  if (marker === 'for') {
    return 'Sentencia: Para'
  }
  if (marker === 'while') {
    return 'Sentencia: Mientras'
  }
  if (marker === 'repeatUntil') {
    return 'Sentencia: Repetir'
  }

  return 'Sentencia: Segun'
}

function formatRuntimeValue(value: RuntimeValue): string {
  if (typeof value === 'string') {
    return `"${value}"`
  }

  if (typeof value === 'boolean') {
    return value ? 'Verdadero' : 'Falso'
  }

  if (typeof value === 'number') {
    return String(value)
  }

  return JSON.stringify(value, null, 2)
}

function getChangedVariableNames(
  previousVariables: Record<string, RuntimeValue> | null,
  currentVariables: Record<string, RuntimeValue> | null,
): Set<string> {
  if (!previousVariables || !currentVariables) {
    return new Set()
  }

  const changed = new Set<string>()
  for (const [name, currentValue] of Object.entries(currentVariables)) {
    const previousValue = previousVariables[name]
    if (previousValue === undefined || !runtimeValuesEqual(previousValue, currentValue)) {
      changed.add(name)
    }
  }

  return changed
}

function runtimeValuesEqual(left: RuntimeValue, right: RuntimeValue): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}
