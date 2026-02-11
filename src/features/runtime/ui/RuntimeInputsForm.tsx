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
      {fields.map((field) => (
        <label key={field.name} className="block space-y-1.5">
          <span className="flex items-center gap-2 text-sm font-medium text-foreground">
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
  )
}
