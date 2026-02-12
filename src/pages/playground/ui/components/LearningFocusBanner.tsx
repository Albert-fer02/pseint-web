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
      ? `Etapa activa: ${nextStageTitle}.`
      : 'Ruta completada. Puedes subir de nivel.'

  return (
    <section className="learning-focus-sheen relative overflow-hidden rounded-xl border border-border/80 bg-card/90 px-3 py-3 shadow-[0_12px_26px_rgba(15,23,42,0.08)] md:px-4">
      <div
        className="pointer-events-none absolute inset-0 opacity-65"
        aria-hidden="true"
        style={{
          background:
            'linear-gradient(100deg, color-mix(in srgb, var(--primary) 22%, transparent) 0%, color-mix(in srgb, var(--accent) 60%, transparent) 52%, transparent 100%)',
        }}
      />

      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Modo Aprendizaje Activo</p>
          <h2 className="truncate text-base font-semibold tracking-tight text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {statusMessage}
          </p>
        </div>

        <Button type="button" size="sm" variant="secondary" onClick={onGoToPractice}>
          Continuar ruta
        </Button>
      </div>
    </section>
  )
}
