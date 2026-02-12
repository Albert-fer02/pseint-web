import {
  practiceUnits,
  type PracticeExercise,
  type PracticeProgressEntry,
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
  onUnitChange: (unitId: PracticeUnitId) => void
  onExerciseChange: (exerciseId: string) => void
  onLoadExercise: () => void
  onLoadSolution: () => void
  onMarkCompleted: () => void
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
  onUnitChange,
  onExerciseChange,
  onLoadExercise,
  onLoadSolution,
  onMarkCompleted,
  onResetProgress,
}: PracticeGuidedCardProps) {
  return (
    <Card id={cardId} className={cardClassName}>
      <CardHeader>
        <CardTitle>Modo practica guiada</CardTitle>
        <CardDescription>Elige un ejercicio, intenta resolverlo y sigue tu progreso.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Unidad</span>
          <select
            className="h-11 w-full rounded-lg border border-border bg-card px-3 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
            value={selectedUnitId}
            onChange={(event) => onUnitChange(event.target.value as PracticeUnitId)}
          >
            {practiceUnits.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.title}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ejercicio</span>
          <select
            className="h-11 w-full rounded-lg border border-border bg-card px-3 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
            value={selectedExercise?.id ?? ''}
            onChange={(event) => onExerciseChange(event.target.value)}
          >
            {exercisesByUnit.map((exercise) => (
              <option key={exercise.id} value={exercise.id}>
                [{exercise.level}] {exercise.title}
              </option>
            ))}
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

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Intentos: {selectedProgress.attempts}</Badge>
              <Badge variant={selectedProgress.completed ? 'secondary' : 'outline'}>
                Estado: {selectedProgress.completed ? 'Completado' : 'Pendiente'}
              </Badge>
              <Badge variant="secondary">Nivel: {selectedExercise.level}</Badge>
              <Badge variant="outline">Tema: {selectedExercise.topic}</Badge>
              <Badge variant="outline">{selectedExercise.estimatedMinutes} min</Badge>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button type="button" variant="secondary" onClick={onLoadExercise}>
                Cargar ejercicio
              </Button>
              <Button type="button" variant="outline" onClick={onLoadSolution}>
                Ver solucion
              </Button>
              <Button type="button" variant="outline" onClick={onMarkCompleted}>
                Marcar completado
              </Button>
              <Button type="button" variant="ghost" onClick={onResetProgress}>
                Reset progreso
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
