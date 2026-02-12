import {
  getNextPendingStageId,
  practiceStageFlow,
  type PracticeExercise,
  type PracticeProgressEntry,
} from '@/features/runtime/model/practiceExercises'
import { Button } from '@/shared/ui/button'

interface LearningFocusBannerProps {
  selectedExercise: PracticeExercise | null
  selectedProgress: PracticeProgressEntry
  parserError: string | null
  onGoToPractice: () => void
}

export function LearningFocusBanner({
  selectedExercise,
  selectedProgress,
  parserError,
  onGoToPractice,
}: LearningFocusBannerProps) {
  const nextStage = getNextPendingStageId(selectedProgress)
  const nextStageTitle = practiceStageFlow.find((stage) => stage.id === nextStage)?.title ?? null
  const title = selectedExercise?.title ?? 'Selecciona un ejercicio para comenzar'

  const statusMessage = parserError
    ? 'Corrige la sintaxis antes de avanzar.'
    : nextStageTitle
      ? `Tu foco actual es la etapa "${nextStageTitle}".`
      : 'Ruta completa. Puedes subir de dificultad.'

  return (
    <section className="learning-focus-sheen relative overflow-hidden rounded-2xl border border-border/80 bg-card/90 px-4 py-4 shadow-[0_16px_32px_rgba(15,23,42,0.08)] md:px-5">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        aria-hidden="true"
        style={{
          background:
            'linear-gradient(100deg, color-mix(in srgb, var(--primary) 22%, transparent) 0%, color-mix(in srgb, var(--accent) 60%, transparent) 52%, transparent 100%)',
        }}
      />

      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Modo Aprendizaje Activo</p>
          <h2 className="truncate text-lg font-semibold tracking-tight text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {statusMessage}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" onClick={onGoToPractice}>
            Continuar ruta
          </Button>
        </div>
      </div>
    </section>
  )
}
