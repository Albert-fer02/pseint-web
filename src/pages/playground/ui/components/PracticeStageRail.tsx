import {
  getNextPendingStageId,
  isStageCompleted,
  type PracticeProgressEntry,
  type PracticeStageDefinition,
} from '@/features/runtime/model/practiceExercises'
import { cn } from '@/shared/lib/utils'

interface PracticeStageRailProps {
  stageFlow: PracticeStageDefinition[]
  selectedProgress: PracticeProgressEntry
}

export function PracticeStageRail({ stageFlow, selectedProgress }: PracticeStageRailProps) {
  const nextStageId = getNextPendingStageId(selectedProgress)
  const completedCount = stageFlow.filter((stage) => isStageCompleted(selectedProgress, stage.id)).length
  const completionRate = stageFlow.length > 0 ? Math.round((completedCount / stageFlow.length) * 100) : 0

  return (
    <section className="space-y-2 rounded-lg bg-background/60 p-3 ring-1 ring-border/60" aria-label="Progreso por etapas">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Flujo de resolucion</p>
        <p className="text-xs text-muted-foreground">{completedCount}/{stageFlow.length} etapas</p>
      </div>

      <div className="h-1.5 rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out" style={{ width: `${completionRate}%` }} />
      </div>

      <ol className="flex flex-wrap gap-2">
        {stageFlow.map((stage, index) => {
          const completed = isStageCompleted(selectedProgress, stage.id)
          const isActive = nextStageId === stage.id

          return (
            <li
              key={stage.id}
              className={cn(
                'rounded-md px-2.5 py-1.5 text-xs font-medium ring-1 transition-colors',
                completed
                  ? 'bg-primary/12 text-primary ring-primary/30'
                  : isActive
                    ? 'bg-accent/45 text-accent-foreground ring-accent-foreground/25'
                    : 'bg-card/80 text-muted-foreground ring-border/70',
              )}
            >
              {index + 1}. {stage.title}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
