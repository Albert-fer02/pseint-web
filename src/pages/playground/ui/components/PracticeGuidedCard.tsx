import { useMemo, useState } from 'react'
import {
  buildPracticeCheckpoint,
  getNextPendingStageId,
  isStageCompleted,
  isStageUnlocked,
  practiceUnits,
  REFLECTION_MIN_LENGTH,
  type PracticeExercise,
  type PracticeExerciseAccess,
  type PracticeProgressEntry,
  type PracticeStageDefinition,
  type PracticeUnitId,
} from '@/features/runtime/model/practiceExercises'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { PracticeStageRail } from '@/pages/playground/ui/components/PracticeStageRail'

interface PracticeGuidedCardProps {
  cardId: string
  cardClassName: string
  selectedUnitId: PracticeUnitId
  selectedExercise: PracticeExercise | null
  exercisesByUnit: PracticeExercise[]
  selectedUnitTitle: string
  selectedProgress: PracticeProgressEntry
  selectedExerciseAccess: PracticeExerciseAccess
  stageFlow: PracticeStageDefinition[]
  exerciseAccessById: Record<string, PracticeExerciseAccess>
  unlockedUnitIds: PracticeUnitId[]
  onUnitChange: (unitId: PracticeUnitId) => void
  onExerciseChange: (exerciseId: string) => void
  onLoadExercise: () => void
  onLoadSolution: () => void
  onMarkLearned: () => void
  onSaveReflection: (note: string) => void
  onResetProgress: () => void
}

export function PracticeGuidedCard({
  cardId,
  cardClassName,
  selectedUnitId,
  selectedExercise,
  exercisesByUnit,
  selectedUnitTitle,
  selectedProgress,
  selectedExerciseAccess,
  stageFlow,
  exerciseAccessById,
  unlockedUnitIds,
  onUnitChange,
  onExerciseChange,
  onLoadExercise,
  onLoadSolution,
  onMarkLearned,
  onSaveReflection,
  onResetProgress,
}: PracticeGuidedCardProps) {
  const [reflectionDraft, setReflectionDraft] = useState(() => selectedProgress.reflectionNote ?? '')
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null)
  const [checkpointFeedback, setCheckpointFeedback] = useState<string | null>(null)

  const checkpoint = useMemo(() => (selectedExercise ? buildPracticeCheckpoint(selectedExercise) : null), [selectedExercise])
  const nextStageId = useMemo(() => getNextPendingStageId(selectedProgress), [selectedProgress])
  const activeStage = stageFlow.find((stage) => stage.id === nextStageId) ?? stageFlow.at(-1) ?? null
  const canSaveReflection = reflectionDraft.trim().length >= REFLECTION_MIN_LENGTH
  const canRevealSolution = selectedProgress.attempts >= 2 || selectedProgress.completed

  const validateCheckpoint = () => {
    if (!checkpoint || selectedOptionIndex === null) {
      setCheckpointFeedback('Selecciona una opcion para validar tu comprension.')
      return
    }

    if (selectedOptionIndex === checkpoint.correctIndex) {
      onMarkLearned()
      setCheckpointFeedback(checkpoint.successMessage)
      return
    }

    setCheckpointFeedback('Respuesta incorrecta. Revisa el objetivo y vuelve a intentarlo.')
  }

  return (
    <Card id={cardId} className={cardClassName}>
      <CardHeader>
        <CardTitle>Laboratorio guiado</CardTitle>
        <CardDescription>Practica con checkpoints reales para consolidar logica antes de subir de nivel.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Unidad</span>
            <select
              className="h-11 w-full rounded-lg border border-border bg-card px-3 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
              value={selectedUnitId}
              onChange={(event) => onUnitChange(event.target.value as PracticeUnitId)}
            >
              {practiceUnits.map((unit) => {
                const unitUnlocked = unlockedUnitIds.includes(unit.id)
                return (
                  <option key={unit.id} value={unit.id} disabled={!unitUnlocked}>
                    {unit.title} {unitUnlocked ? '' : '(Bloqueada)'}
                  </option>
                )
              })}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ejercicio</span>
            <select
              className="h-11 w-full rounded-lg border border-border bg-card px-3 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
              value={selectedExercise?.id ?? ''}
              onChange={(event) => onExerciseChange(event.target.value)}
            >
              {exercisesByUnit.map((exercise) => {
                const access = exerciseAccessById[exercise.id]
                return (
                  <option key={exercise.id} value={exercise.id} disabled={!access?.unlocked}>
                    [{exercise.level}] {exercise.title} {access?.unlocked ? '' : '(Bloqueado)'}
                  </option>
                )
              })}
            </select>
          </label>
        </div>

        {selectedExercise ? (
          <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
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
                  <p className="text-sm font-medium text-foreground">{nextStageId ?? 'Ruta completada'}</p>
                </div>
              </div>
            </div>

            <PracticeStageRail stageFlow={stageFlow} selectedProgress={selectedProgress} />

            {activeStage ? (
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
                                onChange={() => setSelectedOptionIndex(index)}
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
                          onClick={validateCheckpoint}
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
                      onChange={(event) => setReflectionDraft(event.target.value)}
                      disabled={!selectedExerciseAccess.unlocked || !isStageUnlocked(selectedProgress, activeStage.id)}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={!selectedExerciseAccess.unlocked || !canSaveReflection}
                      onClick={() => onSaveReflection(reflectionDraft)}
                    >
                      Guardar reflexion
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
