import {
  practiceUnits,
  type PracticeExercise,
  type PracticeExerciseAccess,
  type PracticeUnitId,
} from '@/features/runtime/model/practiceExercises'

interface PracticeGuidedSelectorsProps {
  selectedUnitId: PracticeUnitId
  selectedExerciseId: string
  exercisesByUnit: PracticeExercise[]
  exerciseAccessById: Record<string, PracticeExerciseAccess>
  unlockedUnitIds: PracticeUnitId[]
  onUnitChange: (unitId: PracticeUnitId) => void
  onExerciseChange: (exerciseId: string) => void
}

export function PracticeGuidedSelectors({
  selectedUnitId,
  selectedExerciseId,
  exercisesByUnit,
  exerciseAccessById,
  unlockedUnitIds,
  onUnitChange,
  onExerciseChange,
}: PracticeGuidedSelectorsProps) {
  return (
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
          value={selectedExerciseId}
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
  )
}
