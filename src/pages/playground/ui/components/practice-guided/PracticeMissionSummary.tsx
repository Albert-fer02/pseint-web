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
    <>
      <div className="rounded-xl border border-border/70 bg-card/80 p-3">
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
          <p className="mt-3 rounded-md border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
            {selectedExerciseAccess.reason ?? 'Ejercicio bloqueado por mastery.'}
          </p>
        ) : null}
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-3 rounded-xl border border-border/70 bg-card/80 p-3">
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

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Button type="button" variant="secondary" onClick={onLoadExercise} disabled={!selectedExerciseAccess.unlocked}>
              Cargar base
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onLoadSolution}
              disabled={!selectedExerciseAccess.unlocked || !canRevealSolution}
            >
              Ver solucion
            </Button>
            <Button type="button" variant="ghost" onClick={onResetProgress}>
              Reiniciar
            </Button>
          </div>

          {!canRevealSolution ? (
            <p className="text-xs text-muted-foreground" aria-live="polite">
              La solucion se habilita despues de 2 intentos o al completar el reto.
            </p>
          ) : null}
        </div>

        <div className="space-y-2 rounded-xl border border-border/70 bg-card/80 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Estado del ejercicio</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg border border-border/70 bg-background/70 px-3 py-2">
              <p className="text-xs text-muted-foreground">Nivel</p>
              <p className="font-medium text-foreground">{selectedExercise.level}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-background/70 px-3 py-2">
              <p className="text-xs text-muted-foreground">Tema</p>
              <p className="font-medium text-foreground">{selectedExercise.topic}</p>
            </div>
          </div>

          <div className="rounded-lg border border-border/70 bg-background/70 px-3 py-2">
            <p className="text-xs text-muted-foreground">Siguiente etapa</p>
            <p className="text-sm font-medium text-foreground">{nextStageLabel}</p>
          </div>
        </div>
      </div>
    </>
  )
}
