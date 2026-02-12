import { Badge } from '@/shared/ui/badge'
import type { PracticeExercise, PracticeProgress, PracticeUnit } from '@/features/runtime/model/practiceExercises'

interface LearningPathPanelProps {
  units: PracticeUnit[]
  exercises: PracticeExercise[]
  progress: PracticeProgress
}

export function LearningPathPanel({ units, exercises, progress }: LearningPathPanelProps) {
  return (
    <div className="space-y-3">
      {units.map((unit) => {
        const unitExercises = exercises.filter((exercise) => exercise.unitId === unit.id)
        const completedCount = unitExercises.filter((exercise) => progress[exercise.id]?.completed).length
        const completionRate = unitExercises.length === 0 ? 0 : Math.round((completedCount / unitExercises.length) * 100)

        return (
          <div key={unit.id} className="rounded-lg border border-border bg-card/70 p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">{unit.title}</p>
              <Badge variant="outline">{completionRate}% completado</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{unit.description}</p>

            <div className="mt-3 h-2 rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${completionRate}%` }} />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {unit.topics.map((topic) => (
                <Badge key={topic.id} variant={topic.status === 'disponible' ? 'secondary' : 'outline'}>
                  {topic.title} ({topic.status})
                </Badge>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
