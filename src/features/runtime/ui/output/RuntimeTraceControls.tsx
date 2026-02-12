import type { RuntimeExecution } from '@/entities/pseint/model/types'
import { Button } from '@/shared/ui/button'

interface RuntimeTraceControlsProps {
  execution: RuntimeExecution
  boundedIndex: number
  currentStep: RuntimeExecution['trace'][number] | null
  markerText: string
  isPlaying: boolean
  onMoveToStep: (index: number) => void
  onTogglePlayback: () => void
}

export function RuntimeTraceControls({
  execution,
  boundedIndex,
  currentStep,
  markerText,
  isPlaying,
  onMoveToStep,
  onTogglePlayback,
}: RuntimeTraceControlsProps) {
  if (!currentStep) {
    return null
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Paso a paso ({boundedIndex + 1}/{execution.trace.length})
        </p>
        <div className="text-right text-xs text-muted-foreground">
          <p>{markerText}</p>
          <p>Paso motor: {currentStep.stepNumber}</p>
        </div>
      </div>

      <label className="block space-y-1">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Timeline de ejecucion</span>
        <input
          type="range"
          min={0}
          max={Math.max(0, execution.trace.length - 1)}
          value={boundedIndex}
          onChange={(event) => onMoveToStep(Number(event.target.value))}
          className="h-2 w-full cursor-pointer accent-[var(--primary)]"
          aria-label="Mover entre pasos de ejecución"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onMoveToStep(boundedIndex - 1)}
          disabled={boundedIndex <= 0}
        >
          Anterior
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onMoveToStep(boundedIndex + 1)}
          disabled={boundedIndex >= execution.trace.length - 1}
        >
          Siguiente
        </Button>
        <Button
          type="button"
          size="sm"
          variant={isPlaying ? 'secondary' : 'outline'}
          onClick={onTogglePlayback}
        >
          {isPlaying ? 'Pausar' : 'Reproducir'}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => onMoveToStep(execution.trace.length - 1)}
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
  )
}
