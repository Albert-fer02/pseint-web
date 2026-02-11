import { lazy, Suspense, useMemo, useState } from 'react'
import type { RuntimeInputField } from '@/entities/pseint/model/types'
import { ProgramInsightsPanel } from '@/features/analysis/ui/ProgramInsightsPanel'
import { AiTutorPanel } from '@/features/ai/ui/AiTutorPanel'
import { PseudocodeEditor } from '@/features/editor/ui/PseudocodeEditor'
import { usePseintRuntime } from '@/features/runtime/hooks/usePseintRuntime'
import { defaultInputs, defaultProgram } from '@/features/runtime/model/defaultProgram'
import { RuntimeInputsForm } from '@/features/runtime/ui/RuntimeInputsForm'
import { RuntimeOutputPanel } from '@/features/runtime/ui/RuntimeOutputPanel'
import { extractInputFields } from '@/shared/lib/pseint/analyzer'
import { buildFlowchart } from '@/shared/lib/pseint/flowchart'
import { analyzeProgram } from '@/shared/lib/pseint/insights'
import { parseProgram } from '@/shared/lib/pseint/parser'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'

const MermaidChart = lazy(() => import('@/shared/lib/mermaid/MermaidChart'))

export function PlaygroundPage() {
  const [source, setSource] = useState(defaultProgram)
  const [inputs, setInputs] = useState<Record<string, string>>(defaultInputs)

  const { run, status, result, error } = usePseintRuntime()

  const { inputFields, parserError, flowchartPreview, insights } = useMemo(() => {
    try {
      const ast = parseProgram(source)
      return {
        inputFields: extractInputFields(ast),
        parserError: null,
        flowchartPreview: buildFlowchart(ast),
        insights: analyzeProgram(source, ast),
      }
    } catch (parseError) {
      return {
        inputFields: [],
        parserError: parseError instanceof Error ? parseError.message : 'Error de parseo.',
        flowchartPreview: null,
        insights: null,
      }
    }
  }, [source])

  const handleSourceChange = (nextSource: string) => {
    setSource(nextSource)
    try {
      const ast = parseProgram(nextSource)
      const fields = extractInputFields(ast)
      setInputs((currentInputs) => keepOnlyExpectedInputs(currentInputs, fields))
    } catch {
      // keep previous inputs while user edits invalid code
    }
  }

  const runProgram = async () => {
    if (parserError) {
      return
    }

    try {
      await run(source, inputs)
    } catch {
      // runtime errors are already reflected in hook state
    }
  }

  const runButtonText = status === 'running' ? 'Ejecutando...' : 'Ejecutar programa'
  const isRunDisabled = status === 'running' || Boolean(parserError)

  return (
    <div className="space-y-5 pb-24 md:pb-0">
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Editor PSeInt</CardTitle>
                <CardDescription>Escribe o pega pseudocodigo. La ejecucion corre en Web Worker.</CardDescription>
              </div>
              <Button type="button" variant="outline" onClick={() => handleSourceChange(defaultProgram)}>
                Restaurar ejemplo
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">React + Bun</Badge>
              <Badge variant="secondary">Worker Runtime</Badge>
              <Badge variant="secondary">Mermaid</Badge>
              <Badge variant="secondary">Insights en vivo</Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <PseudocodeEditor value={source} onChange={handleSourceChange} onRunShortcut={() => void runProgram()} />

            <div className="hidden flex-wrap items-center gap-3 md:flex">
              <Button type="button" onClick={() => void runProgram()} disabled={isRunDisabled}>
                {runButtonText}
              </Button>
              <p className="text-xs text-muted-foreground">Atajo: Ctrl/Cmd + Enter para ejecutar.</p>
            </div>

            {parserError ? (
              <p className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-sm text-amber-700">
                {parserError}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Entradas</CardTitle>
              <CardDescription>Valores para las sentencias Leer.</CardDescription>
            </CardHeader>
            <CardContent>
              <RuntimeInputsForm
                fields={inputFields}
                values={inputs}
                onChange={(name, value) => {
                  setInputs((prev) => ({
                    ...prev,
                    [name]: value,
                  }))
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Datos automáticos</CardTitle>
              <CardDescription>Metricas de complejidad, nivel y recomendaciones segun tu codigo.</CardDescription>
            </CardHeader>
            <CardContent>
              {insights ? (
                <ProgramInsightsPanel insights={insights} />
              ) : (
                <p className="text-sm text-muted-foreground">Corrige el parseo para calcular métricas automáticas.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tutor IA</CardTitle>
              <CardDescription>Feedback pedagogico contextual y accionable.</CardDescription>
            </CardHeader>
            <CardContent>
              <AiTutorPanel source={source} parserError={parserError} insights={insights} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Salida de ejecucion</CardTitle>
              <CardDescription>Consola y estado final de variables.</CardDescription>
            </CardHeader>
            <CardContent>
              <RuntimeOutputPanel execution={result?.execution ?? null} error={error} status={status} />
              {result?.execution ? (
                <p className="mt-3 text-xs text-muted-foreground">Pasos ejecutados: {result.execution.stepsExecuted}</p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Diagrama de flujo</CardTitle>
          <CardDescription>Se actualiza automaticamente al cambiar el codigo.</CardDescription>
        </CardHeader>
        <CardContent>
          {flowchartPreview ? (
            <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando renderer de diagramas...</p>}>
              <MermaidChart chart={flowchartPreview} />
            </Suspense>
          ) : (
            <p className="text-sm text-muted-foreground">Corrige el código para generar el diagrama.</p>
          )}
        </CardContent>
      </Card>

      <MobileRunDock
        onRun={runProgram}
        disabled={isRunDisabled}
        statusText={runButtonText}
        hasParserError={Boolean(parserError)}
      />
    </div>
  )
}

function MobileRunDock({
  onRun,
  disabled,
  statusText,
  hasParserError,
}: {
  onRun: () => Promise<void>
  disabled: boolean
  statusText: string
  hasParserError: boolean
}) {
  return (
    <div className="surface-scrim fixed inset-x-0 bottom-0 z-20 border-t border-border px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur md:hidden">
      <p className="mb-2 text-center text-[11px] text-muted-foreground">
        {hasParserError ? 'Corrige el parser error para ejecutar.' : 'Accion principal en zona ergonomica (pulgar).'}
      </p>
      <Button type="button" className="w-full" onClick={() => void onRun()} disabled={disabled}>
        {statusText}
      </Button>
    </div>
  )
}

function keepOnlyExpectedInputs(
  currentInputs: Record<string, string>,
  fields: RuntimeInputField[],
): Record<string, string> {
  const nextEntries = fields.map((field) => [field.name, currentInputs[field.name] ?? defaultInputs[field.name] ?? ''] as const)
  return Object.fromEntries(nextEntries)
}
