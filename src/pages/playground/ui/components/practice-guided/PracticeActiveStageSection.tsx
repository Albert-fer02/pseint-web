import {
  isStageCompleted,
  isStageUnlocked,
  REFLECTION_MIN_LENGTH,
  type PracticeCheckpoint,
  type PracticeExercise,
  type PracticeExerciseAccess,
  type PracticeProgressEntry,
  type PracticeStageDefinition,
} from '@/features/runtime/model/practiceExercises'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'

interface PracticeActiveStageSectionProps {
  activeStage: PracticeStageDefinition | null
  selectedExercise: PracticeExercise
  selectedProgress: PracticeProgressEntry
  selectedExerciseAccess: PracticeExerciseAccess
  checkpoint: PracticeCheckpoint | null
  selectedOptionIndex: number | null
  checkpointFeedback: string | null
  reflectionDraft: string
  canSaveReflection: boolean
  onOptionChange: (index: number) => void
  onValidateCheckpoint: () => void
  onReflectionDraftChange: (value: string) => void
  onSaveReflection: () => void
}

export function PracticeActiveStageSection({
  activeStage,
  selectedExercise,
  selectedProgress,
  selectedExerciseAccess,
  checkpoint,
  selectedOptionIndex,
  checkpointFeedback,
  reflectionDraft,
  canSaveReflection,
  onOptionChange,
  onValidateCheckpoint,
  onReflectionDraftChange,
  onSaveReflection,
}: PracticeActiveStageSectionProps) {
  if (!activeStage) {
    return null
  }

  return (
    <div className="rounded-xl border border-border/80 bg-card/85 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Etapa activa</p>
          <h4 className="text-sm font-semibold text-foreground">{activeStage.title}</h4>
        </div>
        <Badge variant={isStageCompleted(selectedProgress, activeStage.id) ? 'secondary' : 'outline'}>
          {isStageCompleted(selectedProgress, activeStage.id) ? 'Completada' : 'En curso'}
        </Badge>
      </div>

      {activeStage.id === 'aprende' ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Checkpoint: valida que comprendiste el objetivo antes de codificar.</p>
          {checkpoint ? (
            <fieldset className="space-y-2 rounded-lg border border-border/70 bg-muted/15 p-3">
              <legend className="text-sm text-foreground">{checkpoint.question}</legend>
              <div className="space-y-1">
                {checkpoint.options.map((option, index) => (
                  <label key={option} className="flex items-start gap-2 text-sm text-foreground">
                    <input
                      type="radio"
                      name={`checkpoint-${selectedExercise.id}`}
                      value={index}
                      checked={selectedOptionIndex === index}
                      onChange={() => onOptionChange(index)}
                      disabled={!selectedExerciseAccess.unlocked || !isStageUnlocked(selectedProgress, activeStage.id)}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>

              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!selectedExerciseAccess.unlocked || isStageCompleted(selectedProgress, activeStage.id)}
                onClick={onValidateCheckpoint}
              >
                Validar checkpoint
              </Button>

              {checkpointFeedback ? <p className="text-xs text-muted-foreground">{checkpointFeedback}</p> : null}
            </fieldset>
          ) : null}
        </div>
      ) : null}

      {activeStage.id === 'practica' ? (
        <p className="text-sm text-muted-foreground">Ejecuta el programa al menos una vez para validar la etapa practica.</p>
      ) : null}

      {activeStage.id === 'crea' ? (
        <p className="text-sm text-muted-foreground">
          Modifica tu solucion base y ejecuta. Esta etapa se valida cuando detectamos una version creada por ti.
        </p>
      ) : null}

      {activeStage.id === 'ejecuta' ? (
        <p className="text-sm text-muted-foreground">La etapa se completa cuando el programa corre sin error de runtime.</p>
      ) : null}

      {activeStage.id === 'resuelve' ? (
        <p className="text-sm text-muted-foreground">La etapa se completa cuando la salida coincide con el resultado esperado.</p>
      ) : null}

      {activeStage.id === 'reflexiona' ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Reflexiona en minimo {REFLECTION_MIN_LENGTH} caracteres.</p>
          <textarea
            className="min-h-24 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Que aprendiste y que mejoraras en el siguiente intento..."
            value={reflectionDraft}
            onChange={(event) => onReflectionDraftChange(event.target.value)}
            disabled={!selectedExerciseAccess.unlocked || !isStageUnlocked(selectedProgress, activeStage.id)}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!selectedExerciseAccess.unlocked || !canSaveReflection}
            onClick={onSaveReflection}
          >
            Guardar reflexion
          </Button>
        </div>
      ) : null}
    </div>
  )
}
