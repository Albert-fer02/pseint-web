import type {
  PracticeExercise,
  PracticeExerciseAccess,
  PracticeProgressEntry,
} from '@/features/runtime/model/practiceExercises'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'

interface PracticeMissionSummaryProps {
  selectedExercise: PracticeExercise
  selectedUnitTitle: string
  selectedProgress: PracticeProgressEntry
  selectedExerciseAccess: PracticeExerciseAccess
  nextStageLabel: string
  canRevealSolution: boolean
  onLoadExercise: () => void
  onLoadSolution: () => void
  onResetProgress: () => void
}

export function PracticeMissionSummary({
  selectedExercise,
  selectedUnitTitle,
  selectedProgress,
  selectedExerciseAccess,
  nextStageLabel,
  canRevealSolution,
  onLoadExercise,
  onLoadSolution,
  onResetProgress,
}: PracticeMissionSummaryProps) {
  return (
    <div className="space-y-3 rounded-xl bg-background/65 p-3 ring-1 ring-border/70">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Mision actual</p>
          <h3 className="text-base font-semibold text-foreground">{selectedExercise.title}</h3>
          <p className="text-sm text-muted-foreground">{selectedUnitTitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={selectedProgress.completed ? 'secondary' : 'outline'}>
            {selectedProgress.completed ? 'Completado' : 'En progreso'}
          </Badge>
          <Badge variant="outline">Intentos: {selectedProgress.attempts}</Badge>
          <Badge variant="outline">{selectedExercise.estimatedMinutes} min</Badge>
        </div>
      </div>

      {!selectedExerciseAccess.unlocked ? (
        <p
          className="rounded-md border px-3 py-2 text-xs text-foreground/90"
          style={{ borderColor: 'color-mix(in srgb, #f59e0b 36%, transparent)', backgroundColor: 'color-mix(in srgb, #f59e0b 10%, transparent)' }}
        >
          {selectedExerciseAccess.reason ?? 'Ejercicio bloqueado por mastery.'}
        </p>
      ) : null}

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(14rem,0.8fr)]">
        <div className="space-y-3 rounded-lg bg-card/75 p-3 ring-1 ring-border/60">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Objetivo</p>
            <p className="text-sm text-foreground">{selectedExercise.objective}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Checklist de resolucion</p>
            <ul className="space-y-1 text-sm text-foreground">
              {selectedExercise.instructions.map((instruction) => (
                <li key={instruction}>- {instruction}</li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              className="min-w-[8.5rem] flex-1 sm:flex-none"
              onClick={onLoadExercise}
              disabled={!selectedExerciseAccess.unlocked}
            >
              Cargar base
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-w-[8.5rem] flex-1 sm:flex-none"
              onClick={onLoadSolution}
              disabled={!selectedExerciseAccess.unlocked || !canRevealSolution}
            >
              Ver solucion
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="min-w-[8.5rem] flex-1 sm:flex-none"
              onClick={onResetProgress}
            >
              Reiniciar
            </Button>
          </div>

          {!canRevealSolution ? (
            <p className="text-xs text-muted-foreground" aria-live="polite">
              La solucion se habilita despues de 2 intentos o al completar el reto.
            </p>
          ) : null}
        </div>

        <div className="space-y-2 rounded-lg bg-card/75 p-3 ring-1 ring-border/60">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Estado del ejercicio</p>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-md bg-background/75 px-3 py-2 ring-1 ring-border/60">
              <p className="text-xs text-muted-foreground">Nivel</p>
              <p className="font-medium text-foreground">{selectedExercise.level}</p>
            </div>
            <div className="rounded-md bg-background/75 px-3 py-2 ring-1 ring-border/60">
              <p className="text-xs text-muted-foreground">Tema</p>
              <p className="font-medium text-foreground break-words">{selectedExercise.topic}</p>
            </div>
          </div>

          <div className="rounded-md bg-background/75 px-3 py-2 ring-1 ring-border/60">
            <p className="text-xs text-muted-foreground">Siguiente etapa</p>
            <p className="text-sm font-medium capitalize text-foreground break-words">{nextStageLabel}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
