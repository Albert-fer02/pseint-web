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

  return (
    <ol className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3" aria-label="Progreso por etapas">
      {stageFlow.map((stage, index) => {
        const completed = isStageCompleted(selectedProgress, stage.id)
        const isActive = nextStageId === stage.id

        return (
          <li
            key={stage.id}
            className={cn(
              'relative rounded-xl border px-3 py-2 transition-colors',
              completed
                ? 'border-primary/30 bg-primary/10'
                : isActive
                  ? 'border-accent-foreground/30 bg-accent/35'
                  : 'border-border/70 bg-card/70',
            )}
          >
            <div className="flex items-start gap-2">
              <span
                className={cn(
                  'mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-semibold',
                  completed
                    ? 'border-primary/60 bg-primary text-primary-foreground'
                    : isActive
                      ? 'border-accent-foreground/50 bg-accent text-accent-foreground'
                      : 'border-border bg-background text-muted-foreground',
                )}
                aria-hidden="true"
              >
                {completed ? 'OK' : index + 1}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{stage.title}</p>
                <p className="text-xs leading-relaxed text-muted-foreground">{stage.description}</p>
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
