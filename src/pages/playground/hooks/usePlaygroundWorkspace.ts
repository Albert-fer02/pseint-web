import { useCallback, useEffect, useState } from 'react'
import { defaultInputs, defaultProgram } from '@/features/runtime/model/defaultProgram'
import { examplePrograms, getExampleProgramById } from '@/features/runtime/model/examplePrograms'
import {
  loadPlaygroundWorkspace,
  savePlaygroundWorkspace,
  type PlaygroundProject,
} from '@/features/runtime/model/projects'
import { AUTOSAVE_DELAY_MS } from '@/pages/playground/model/playgroundUiConfig'
import { useWorkspaceProjectActions } from '@/pages/playground/hooks/workspace/useWorkspaceProjectActions'
import { keepOnlyExpectedInputs } from '@/pages/playground/lib/playgroundRuntimeUtils'
import { extractInputFields } from '@/shared/lib/pseint/analyzer'
import { formatPseintSource } from '@/shared/lib/pseint/formatter'
import { parseProgram } from '@/shared/lib/pseint/parser'

const initialWorkspace = loadPlaygroundWorkspace({
  fallbackSource: defaultProgram,
  fallbackInputs: defaultInputs,
})
const initialActiveProject =
  initialWorkspace.projects.find((project) => project.id === initialWorkspace.activeProjectId) ?? initialWorkspace.projects[0]
const initialExampleId = examplePrograms[0]?.id ?? ''

interface UsePlaygroundWorkspaceOptions {
  onRuntimeReset: () => void
}

export function usePlaygroundWorkspace({ onRuntimeReset }: UsePlaygroundWorkspaceOptions) {
  const [projects, setProjects] = useState<PlaygroundProject[]>(() => initialWorkspace.projects)
  const [activeProjectId, setActiveProjectId] = useState(() => initialWorkspace.activeProjectId)
  const [source, setSource] = useState(initialActiveProject.source)
  const [inputs, setInputs] = useState<Record<string, string>>(initialActiveProject.inputs)
  const [selectedExampleId, setSelectedExampleId] = useState(initialExampleId)

  const syncInputsWithSource = useCallback((nextSource: string, fallbackInputs: Record<string, string>) => {
    setInputs(computeSyncedInputs(nextSource, fallbackInputs))
  }, [])

  const [
    switchProject,
    createProject,
    renameProject,
    deleteProject,
    hydrateCurrentDraft,
  ] = useWorkspaceProjectActions({
    projects,
    activeProjectId,
    source,
    inputs,
    setProjects,
    setActiveProjectId,
    setSource,
    syncInputsWithSource,
    onRuntimeReset,
  })

  const handleSourceChange = useCallback((nextSource: string) => {
    setSource(nextSource)
    setInputs((currentInputs) => computeSyncedInputs(nextSource, currentInputs))
  }, [])

  const applyProgramTemplate = useCallback(
    (nextSource: string, nextInputs: Record<string, string>) => {
      setSource(nextSource)
      syncInputsWithSource(nextSource, nextInputs)
      onRuntimeReset()
    },
    [onRuntimeReset, syncInputsWithSource],
  )

  const loadSelectedExample = useCallback(() => {
    const selectedExample = getExampleProgramById(selectedExampleId)
    if (!selectedExample) {
      return
    }

    applyProgramTemplate(selectedExample.source, selectedExample.inputs)
  }, [applyProgramTemplate, selectedExampleId])

  const formatCurrentSource = useCallback(() => {
    const formatted = formatPseintSource(source)
    handleSourceChange(formatted)
  }, [handleSourceChange, source])

  const appendSnippetAtEnd = useCallback(
    (snippet: string) => {
      const nextSource = `${source.trimEnd()}\n\n${snippet}`
      handleSourceChange(nextSource)
    },
    [handleSourceChange, source],
  )

  const restoreDefaultProgram = useCallback(() => {
    applyProgramTemplate(defaultProgram, defaultInputs)
  }, [applyProgramTemplate])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const persistedProjects = hydrateCurrentDraft(projects)
      savePlaygroundWorkspace({
        projects: persistedProjects,
        activeProjectId,
      })
    }, AUTOSAVE_DELAY_MS)

    return () => clearTimeout(timeoutId)
  }, [projects, activeProjectId, hydrateCurrentDraft])

  return {
    projects,
    activeProjectId,
    source,
    inputs,
    selectedExampleId,
    setSelectedExampleId,
    setInputs,
    switchProject,
    createProject,
    renameProject,
    deleteProject,
    loadSelectedExample,
    formatCurrentSource,
    appendSnippetAtEnd,
    handleSourceChange,
    restoreDefaultProgram,
    applyProgramTemplate,
  }
}

function computeSyncedInputs(nextSource: string, fallbackInputs: Record<string, string>): Record<string, string> {
  try {
    const ast = parseProgram(nextSource)
    const fields = extractInputFields(ast)
    return keepOnlyExpectedInputs(fallbackInputs, fields, defaultInputs)
  } catch {
    return fallbackInputs
  }
}
