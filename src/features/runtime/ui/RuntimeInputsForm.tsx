import type { RuntimeInputField } from '@/entities/pseint/model/types'
import { Badge } from '@/shared/ui/badge'
import { Input } from '@/shared/ui/input'

interface RuntimeInputsFormProps {
  fields: RuntimeInputField[]
  values: Record<string, string>
  onChange: (name: string, value: string) => void
}

export function RuntimeInputsForm({ fields, values, onChange }: RuntimeInputsFormProps) {
  if (fields.length === 0) {
    return <p className="text-sm text-muted-foreground">Este programa no tiene sentencias Leer.</p>
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Completa estas entradas para ejecutar escenarios de prueba y validar tu solución.
      </p>

      <div className="space-y-2">
        {fields.map((field, index) => (
          <label key={field.name} className="block space-y-1.5 rounded-lg border border-border/75 bg-card/75 p-3">
            <span className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-border bg-background px-1 text-[11px] text-muted-foreground">
                {index + 1}
              </span>
              {field.name}
              <Badge variant="outline">{field.varType}</Badge>
            </span>
            <Input
              type="text"
              className="text-base md:text-sm"
              value={values[field.name] ?? ''}
              onChange={(event) => onChange(field.name, event.target.value)}
              placeholder={`Ingresa ${field.name}`}
            />
          </label>
        ))}
      </div>
    </div>
  )
}
