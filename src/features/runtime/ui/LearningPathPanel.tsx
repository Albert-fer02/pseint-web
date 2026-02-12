import {
  LEVEL_MASTERY_UNLOCK_THRESHOLD,
  UNIT_MASTERY_UNLOCK_THRESHOLD,
  type PracticeMasterySnapshot,
  type PracticeUnit,
} from '@/features/runtime/model/practiceExercises'
import { Badge } from '@/shared/ui/badge'
import { cn } from '@/shared/lib/utils'

interface LearningPathPanelProps {
  units: PracticeUnit[]
  mastery: PracticeMasterySnapshot
}

export function LearningPathPanel({ units, mastery }: LearningPathPanelProps) {
  const unlockedCount = mastery.unlockedUnitIds.length

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-border/70 bg-card/85 p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Radar de progreso</p>
            <h3 className="text-base font-semibold text-foreground">{mastery.overallCompletionRate}% del plan completado</h3>
            <p className="text-xs text-muted-foreground">
              Unidades desbloqueadas: {unlockedCount}/{units.length}
            </p>
          </div>

          <Badge variant="outline">Mastery: {UNIT_MASTERY_UNLOCK_THRESHOLD}% unidad / {LEVEL_MASTERY_UNLOCK_THRESHOLD}% nivel</Badge>
        </div>

        <div className="mt-3 h-2 rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
            style={{ width: `${mastery.overallCompletionRate}%` }}
          />
        </div>
      </section>

      <ol className="space-y-3" aria-label="Ruta por unidades">
        {units.map((unit, index) => {
          const unitMastery = mastery.unitMasteryById[unit.id]
          const isLocked = !unitMastery?.unlocked
          const completionRate = unitMastery?.completionRate ?? 0

          return (
            <li key={unit.id} className="relative">
              {index < units.length - 1 ? (
                <span className="pointer-events-none absolute left-4 top-10 h-[calc(100%-2rem)] w-px bg-border/70" aria-hidden="true" />
              ) : null}

              <article
                className={cn(
                  'rounded-xl border p-3 transition-colors',
                  isLocked ? 'border-border/70 bg-card/70 opacity-75' : 'border-primary/20 bg-primary/5',
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      'mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                      isLocked
                        ? 'border-border bg-background text-muted-foreground'
                        : 'border-primary/50 bg-primary text-primary-foreground',
                    )}
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>

                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">{unit.title}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={isLocked ? 'outline' : 'secondary'}>{isLocked ? 'Bloqueada' : 'Disponible'}</Badge>
                        <Badge variant="outline">{completionRate}%</Badge>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground">{unit.description}</p>

                    <div className="h-1.5 rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out" style={{ width: `${completionRate}%` }} />
                    </div>

                    {isLocked ? (
                      <div className="rounded-md border border-border/70 bg-muted/30 px-2 py-1 text-xs text-muted-foreground">
                        Desbloquea esta unidad para ver mastery por nivel.
                      </div>
                    ) : (
                      <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                        <p>Basico: {unitMastery?.levelCompletionRate.Basico ?? 0}%</p>
                        <p>Intermedio: {unitMastery?.levelCompletionRate.Intermedio ?? 0}%</p>
                        <p>Avanzado: {unitMastery?.levelCompletionRate.Avanzado ?? 0}%</p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {unit.topics.map((topic) => (
                        <Badge key={topic.id} variant="outline" className={cn('rounded-md px-2 py-1', isLocked ? 'opacity-70' : '')}>
                          {topic.title}
                        </Badge>
                      ))}
                    </div>

                    {isLocked ? (
                      <p
                        className="rounded-md border px-2 py-1 text-xs text-foreground/85"
                        style={{ borderColor: 'color-mix(in srgb, #f59e0b 36%, transparent)', backgroundColor: 'color-mix(in srgb, #f59e0b 10%, transparent)' }}
                      >
                        {unitMastery?.unlockRequirement ?? 'Completa la unidad previa para desbloquear.'}
                      </p>
                    ) : null}
                  </div>
                </div>
              </article>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
