import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PlaygroundEditorCard } from '@/pages/playground/ui/components/PlaygroundEditorCard'

vi.mock('@/features/editor/ui/PseudocodeEditor', () => ({
  PseudocodeEditor: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
    <textarea aria-label="editor-mock" value={value} onChange={(event) => onChange(event.target.value)} />
  ),
}))

describe('PlaygroundEditorCard', () => {
  it('triggers project and example actions', () => {
    const onSwitchProject = vi.fn()
    const onCreateProject = vi.fn()
    const onRenameProject = vi.fn()
    const onDeleteProject = vi.fn()
    const onSelectedExampleChange = vi.fn()
    const onLoadSelectedExample = vi.fn()
    const onFormatSource = vi.fn()
    const onSourceChange = vi.fn()
    const onAppendSnippet = vi.fn()
    const onRunProgram = vi.fn()
    const onRestoreDefault = vi.fn()

    render(
      <PlaygroundEditorCard
        projects={[{ id: 'p1', name: 'Proyecto 1' }, { id: 'p2', name: 'Proyecto 2' }]}
        activeProjectId="p1"
        selectedExampleId="variables-basicas"
        source="Algoritmo Demo\nFinAlgoritmo"
        parserErrorLine={null}
        parserError={null}
        parserHint={null}
        isAnalysisPending={false}
        runButtonText="Ejecutar programa"
        isRunDisabled={false}
        onSwitchProject={onSwitchProject}
        onCreateProject={onCreateProject}
        onRenameProject={onRenameProject}
        onDeleteProject={onDeleteProject}
        onSelectedExampleChange={onSelectedExampleChange}
        onLoadSelectedExample={onLoadSelectedExample}
        onFormatSource={onFormatSource}
        onSourceChange={onSourceChange}
        onAppendSnippet={onAppendSnippet}
        onRunProgram={onRunProgram}
        onRestoreDefault={onRestoreDefault}
      />,
    )

    fireEvent.change(screen.getByLabelText('Proyecto activo'), { target: { value: 'p2' } })
    fireEvent.click(screen.getByRole('button', { name: 'Nuevo' }))
    fireEvent.click(screen.getByRole('button', { name: 'Renombrar proyecto' }))
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar proyecto' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cargar ejemplo' }))
    fireEvent.click(screen.getByRole('button', { name: 'Formatear codigo' }))
    fireEvent.click(screen.getByRole('button', { name: 'Restaurar base' }))

    expect(onSwitchProject).toHaveBeenCalledWith('p2')
    expect(onCreateProject).toHaveBeenCalledTimes(1)
    expect(onRenameProject).toHaveBeenCalledTimes(1)
    expect(onDeleteProject).toHaveBeenCalledTimes(1)
    expect(onLoadSelectedExample).toHaveBeenCalledTimes(1)
    expect(onFormatSource).toHaveBeenCalledTimes(1)
    expect(onRestoreDefault).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'Si' }))
    expect(onAppendSnippet).toHaveBeenCalledTimes(1)

    fireEvent.change(screen.getByLabelText('editor-mock'), { target: { value: 'nuevo codigo' } })
    expect(onSourceChange).toHaveBeenCalledWith('nuevo codigo')

    fireEvent.change(screen.getByLabelText('Cargar ejemplo'), { target: { value: 'sumatoria-for' } })
    expect(onSelectedExampleChange).toHaveBeenCalledWith('sumatoria-for')
  })
})
