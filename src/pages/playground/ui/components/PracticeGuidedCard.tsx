import { useMemo, useState } from 'react'
import {
  isStageCompleted,
  isStageUnlocked,
  practiceUnits,
  type PracticeExercise,
  type PracticeExerciseAccess,
  type PracticeProgressEntry,
  type PracticeStageDefinition,
  type PracticeStageId,
  type PracticeUnitId,
} from '@/features/runtime/model/practiceExercises'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'

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
  onMarkCompleted: () => void
  onCompleteStage: (stageId: PracticeStageId) => void
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
  onMarkCompleted,
  onCompleteStage,
  onSaveReflection,
  onResetProgress,
}: PracticeGuidedCardProps) {
  const [reflectionDraft, setReflectionDraft] = useState(() => selectedProgress.reflectionNote ?? '')

  const canSaveReflection = reflectionDraft.trim().length > 0
  const nextStageId = useMemo(() => {
    for (const stage of stageFlow) {
      if (!isStageCompleted(selectedProgress, stage.id)) {
        return stage.id
      }
    }

    return null
  }, [selectedProgress, stageFlow])

  return (
    <Card id={cardId} className={cardClassName}>
      <CardHeader>
        <CardTitle>Modo practica guiada</CardTitle>
        <CardDescription>Ruta por etapas: aprende, practica, crea, ejecuta, resuelve y reflexiona.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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

        {selectedExercise ? (
          <div className="space-y-3 rounded-lg border border-border bg-muted/25 p-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Unidad</p>
              <p className="text-sm text-muted-foreground">{selectedUnitTitle}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Objetivo</p>
              <p className="text-sm text-muted-foreground">{selectedExercise.objective}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Pasos</p>
              <ul className="space-y-1 text-sm text-foreground">
                {selectedExercise.instructions.map((instruction) => (
                  <li key={instruction}>- {instruction}</li>
                ))}
              </ul>
            </div>

            {!selectedExerciseAccess.unlocked ? (
              <p className="rounded-md border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-700">
                {selectedExerciseAccess.reason ?? 'Ejercicio bloqueado por mastery.'}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Intentos: {selectedProgress.attempts}</Badge>
              <Badge variant={selectedProgress.completed ? 'secondary' : 'outline'}>
                Estado: {selectedProgress.completed ? 'Completado' : 'Pendiente'}
              </Badge>
              <Badge variant="secondary">Nivel: {selectedExercise.level}</Badge>
              <Badge variant="outline">Tema: {selectedExercise.topic}</Badge>
              <Badge variant="outline">{selectedExercise.estimatedMinutes} min</Badge>
              <Badge variant="outline">Siguiente: {nextStageId ?? 'Ruta completada'}</Badge>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button type="button" variant="secondary" onClick={onLoadExercise} disabled={!selectedExerciseAccess.unlocked}>
                Cargar ejercicio
              </Button>
              <Button type="button" variant="outline" onClick={onLoadSolution} disabled={!selectedExerciseAccess.unlocked}>
                Ver solucion
              </Button>
              <Button type="button" variant="outline" onClick={onMarkCompleted} disabled={!selectedExerciseAccess.unlocked}>
                Marcar completado
              </Button>
              <Button type="button" variant="ghost" onClick={onResetProgress}>
                Reset progreso
              </Button>
            </div>

            <div className="space-y-2 rounded-md border border-border bg-background/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Etapas pedagogicas</p>
              <div className="space-y-2">
                {stageFlow.map((stage) => {
                  const completed = isStageCompleted(selectedProgress, stage.id)
                  const unlocked = isStageUnlocked(selectedProgress, stage.id)

                  return (
                    <div key={stage.id} className="rounded-md border border-border/70 bg-card p-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-foreground">{stage.title}</p>
                          <p className="text-xs text-muted-foreground">{stage.description}</p>
                        </div>
                        <Badge variant={completed ? 'secondary' : unlocked ? 'outline' : 'outline'}>
                          {completed ? 'Completada' : unlocked ? 'Disponible' : 'Bloqueada'}
                        </Badge>
                      </div>

                      {stage.id !== 'reflexiona' ? (
                        <div className="mt-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={!selectedExerciseAccess.unlocked || completed || !unlocked}
                            onClick={() => onCompleteStage(stage.id)}
                          >
                            Completar etapa
                          </Button>
                        </div>
                      ) : (
                        <div className="mt-2 space-y-2">
                          <textarea
                            className="min-h-20 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            placeholder="Escribe que aprendiste o que mejoraras en el siguiente intento..."
                            value={reflectionDraft}
                            onChange={(event) => setReflectionDraft(event.target.value)}
                            disabled={!selectedExerciseAccess.unlocked || !unlocked}
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={!selectedExerciseAccess.unlocked || !unlocked || !canSaveReflection}
                            onClick={() => onSaveReflection(reflectionDraft)}
                          >
                            Guardar reflexion
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
