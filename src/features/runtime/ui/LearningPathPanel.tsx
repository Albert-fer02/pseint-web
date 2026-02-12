import {
  LEVEL_MASTERY_UNLOCK_THRESHOLD,
  UNIT_MASTERY_UNLOCK_THRESHOLD,
  type PracticeMasterySnapshot,
  type PracticeUnit,
} from '@/features/runtime/model/practiceExercises'
import { Badge } from '@/shared/ui/badge'

interface LearningPathPanelProps {
  units: PracticeUnit[]
  mastery: PracticeMasterySnapshot
}

export function LearningPathPanel({ units, mastery }: LearningPathPanelProps) {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border/70 bg-muted/30 p-3 text-xs text-muted-foreground">
        Desbloqueo por mastery: {UNIT_MASTERY_UNLOCK_THRESHOLD}% por unidad previa y {LEVEL_MASTERY_UNLOCK_THRESHOLD}% por nivel.
      </div>

      {units.map((unit) => {
        const unitMastery = mastery.unitMasteryById[unit.id]
        const isLocked = !unitMastery?.unlocked
        const completionRate = unitMastery?.completionRate ?? 0

        return (
          <div key={unit.id} className="rounded-lg border border-border bg-card/70 p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">{unit.title}</p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={isLocked ? 'outline' : 'secondary'}>{isLocked ? 'Bloqueada' : 'Disponible'}</Badge>
                <Badge variant="outline">{completionRate}% completado</Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{unit.description}</p>

            <div className="mt-3 h-2 rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${completionRate}%` }} />
            </div>

            {isLocked ? (
              <p className="mt-2 text-xs text-amber-700">{unitMastery?.unlockRequirement ?? 'Completa la unidad previa para desbloquear.'}</p>
            ) : null}

            <div className="mt-3 flex flex-wrap gap-2">
              {unit.topics.map((topic) => (
                <Badge key={topic.id} variant={topic.status === 'disponible' ? 'secondary' : 'outline'}>
                  {topic.title}
                </Badge>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-muted-foreground sm:grid-cols-3">
              <p>Basico: {unitMastery?.levelCompletionRate.Basico ?? 0}%</p>
              <p>Intermedio: {unitMastery?.levelCompletionRate.Intermedio ?? 0}%</p>
              <p>Avanzado: {unitMastery?.levelCompletionRate.Avanzado ?? 0}%</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
