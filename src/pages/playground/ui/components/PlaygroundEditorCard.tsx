import { examplePrograms } from '@/features/runtime/model/examplePrograms'
import { PseudocodeEditor } from '@/features/editor/ui/PseudocodeEditor'
import { quickSnippets } from '@/pages/playground/model/playgroundUiConfig'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'

interface ProjectOption {
  id: string
  name: string
}

interface PlaygroundEditorCardProps {
  projects: ProjectOption[]
  activeProjectId: string
  selectedExampleId: string
  source: string
  parserErrorLine: number | null
  parserError: string | null
  parserHint: string | null
  isAnalysisPending: boolean
  runButtonText: string
  isRunDisabled: boolean
  onSwitchProject: (projectId: string) => void
  onCreateProject: () => void
  onRenameProject: () => void
  onDeleteProject: () => void
  onSelectedExampleChange: (exampleId: string) => void
  onLoadSelectedExample: () => void
  onFormatSource: () => void
  onSourceChange: (nextSource: string) => void
  onAppendSnippet: (snippet: string) => void
  onRunProgram: () => void
  onRestoreDefault: () => void
}

export function PlaygroundEditorCard({
  projects,
  activeProjectId,
  selectedExampleId,
  source,
  parserErrorLine,
  parserError,
  parserHint,
  isAnalysisPending,
  runButtonText,
  isRunDisabled,
  onSwitchProject,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
  onSelectedExampleChange,
  onLoadSelectedExample,
  onFormatSource,
  onSourceChange,
  onAppendSnippet,
  onRunProgram,
  onRestoreDefault,
}: PlaygroundEditorCardProps) {
  return (
    <Card className="min-w-0 border-border/80 bg-card/92">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 sm:flex-nowrap">
          <div className="min-w-0">
            <CardTitle>Editor PSeInt</CardTitle>
            <CardDescription>Escribe o pega pseudocodigo y ejecutalo al instante.</CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={onRestoreDefault}
          >
            Restaurar base
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="space-y-2">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Proyecto activo</span>
              <select
                className="h-11 w-full rounded-lg border border-border bg-card px-3 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
                value={activeProjectId}
                onChange={(event) => onSwitchProject(event.target.value)}
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={onCreateProject}>
                Nuevo
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={onRenameProject} aria-label="Renombrar proyecto" title="Renombrar proyecto">
                Ren.
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onDeleteProject}
                disabled={projects.length <= 1}
                aria-label="Eliminar proyecto"
                title="Eliminar proyecto"
              >
                Elim.
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Guardado automatico activo (localStorage).</p>
          </div>

          <div className="space-y-2">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cargar ejemplo</span>
              <select
                className="h-11 w-full rounded-lg border border-border bg-card px-3 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
                value={selectedExampleId}
                onChange={(event) => onSelectedExampleChange(event.target.value)}
              >
                {examplePrograms.map((example) => (
                  <option key={example.id} value={example.id}>
                    [{example.level}] {example.title}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={onLoadSelectedExample}>
                Cargar ejemplo
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={onFormatSource} aria-label="Formatear codigo" title="Formatear codigo">
                Form.
              </Button>
            </div>
          </div>
        </div>

        <PseudocodeEditor
          value={source}
          onChange={onSourceChange}
          onRunShortcut={onRunProgram}
          parserErrorLine={parserErrorLine}
          parserErrorMessage={parserError}
        />

        <details className="rounded-lg border border-border/70 bg-muted/15 p-3">
          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Snippets rapidos
          </summary>
          <div className="mt-3 -mx-1 overflow-x-auto px-1">
            <div className="flex min-w-max items-center gap-2">
              {quickSnippets.map((snippet) => (
                <Button key={snippet.id} type="button" variant="outline" size="sm" onClick={() => onAppendSnippet(snippet.content)}>
                  {snippet.label}
                </Button>
              ))}
            </div>
          </div>
        </details>

        <div className="hidden flex-wrap items-center gap-3 md:flex">
          <Button type="button" onClick={onRunProgram} disabled={isRunDisabled}>
            {runButtonText}
          </Button>
          <p className="text-xs text-muted-foreground">Atajo: Ctrl/Cmd + Enter para ejecutar.</p>
        </div>

        {parserError ? (
          <div className="space-y-2 rounded-lg border px-3 py-2" style={{ borderColor: 'color-mix(in srgb, #f59e0b 40%, transparent)', backgroundColor: 'color-mix(in srgb, #f59e0b 12%, transparent)' }}>
            <p className="text-sm text-foreground">{parserError}</p>
            {parserHint ? <p className="text-xs text-muted-foreground">Sugerencia: {parserHint}</p> : null}
          </div>
        ) : null}

        {isAnalysisPending ? <p className="text-xs text-muted-foreground">Actualizando metricas y diagrama...</p> : null}
      </CardContent>
    </Card>
  )
}
