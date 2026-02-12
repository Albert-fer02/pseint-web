import { useCallback, useEffect, useMemo, useState } from 'react'
import { defaultInputs, defaultProgram } from '@/features/runtime/model/defaultProgram'
import { examplePrograms, getExampleProgramById } from '@/features/runtime/model/examplePrograms'
import {
  createNextProjectName,
  createPlaygroundProject,
  loadPlaygroundWorkspace,
  savePlaygroundWorkspace,
  type PlaygroundProject,
} from '@/features/runtime/model/projects'
import { AUTOSAVE_DELAY_MS } from '@/pages/playground/model/playgroundUiConfig'
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

  const activeProject = useMemo(() => projects.find((project) => project.id === activeProjectId) ?? null, [projects, activeProjectId])
  const selectedExample = useMemo(() => getExampleProgramById(selectedExampleId), [selectedExampleId])

  const buildProjectsWithCurrentDraft = useCallback(
    (baseProjects: PlaygroundProject[]) =>
      baseProjects.map((project) =>
        project.id === activeProjectId
          ? {
              ...project,
              source,
              inputs: { ...inputs },
              updatedAt: new Date().toISOString(),
            }
          : project,
      ),
    [activeProjectId, source, inputs],
  )

  const syncInputsWithSource = useCallback((nextSource: string, fallbackInputs: Record<string, string>) => {
    try {
      const ast = parseProgram(nextSource)
      const fields = extractInputFields(ast)
      setInputs(keepOnlyExpectedInputs(fallbackInputs, fields, defaultInputs))
    } catch {
      setInputs(fallbackInputs)
    }
  }, [])

  const applyProgramTemplate = useCallback(
    (nextSource: string, nextInputs: Record<string, string>) => {
      setSource(nextSource)
      syncInputsWithSource(nextSource, nextInputs)
      onRuntimeReset()
    },
    [onRuntimeReset, syncInputsWithSource],
  )

  const switchProject = useCallback(
    (nextProjectId: string) => {
      if (nextProjectId === activeProjectId) {
        return
      }

      const hydratedProjects = buildProjectsWithCurrentDraft(projects)
      const targetProject = hydratedProjects.find((project) => project.id === nextProjectId)
      if (!targetProject) {
        return
      }

      setProjects(hydratedProjects)
      setActiveProjectId(nextProjectId)
      setSource(targetProject.source)
      syncInputsWithSource(targetProject.source, targetProject.inputs)
      onRuntimeReset()
      savePlaygroundWorkspace({ projects: hydratedProjects, activeProjectId: nextProjectId })
    },
    [activeProjectId, buildProjectsWithCurrentDraft, onRuntimeReset, projects, syncInputsWithSource],
  )

  const createProject = useCallback(() => {
    const hydratedProjects = buildProjectsWithCurrentDraft(projects)
    const projectName = createNextProjectName(hydratedProjects)
    const newProject = createPlaygroundProject({
      name: projectName,
      source: defaultProgram,
      inputs: defaultInputs,
    })
    const nextProjects = [...hydratedProjects, newProject]

    setProjects(nextProjects)
    setActiveProjectId(newProject.id)
    setSource(newProject.source)
    syncInputsWithSource(newProject.source, newProject.inputs)
    onRuntimeReset()
    savePlaygroundWorkspace({ projects: nextProjects, activeProjectId: newProject.id })
  }, [buildProjectsWithCurrentDraft, onRuntimeReset, projects, syncInputsWithSource])

  const renameProject = useCallback(() => {
    if (!activeProject) {
      return
    }

    const proposedName = window.prompt('Nombre del proyecto', activeProject.name)
    if (!proposedName) {
      return
    }

    const trimmedName = proposedName.trim()
    if (!trimmedName.length) {
      return
    }

    const hydratedProjects = buildProjectsWithCurrentDraft(projects)
    const nextProjects = hydratedProjects.map((project) =>
      project.id === activeProjectId
        ? {
            ...project,
            name: trimmedName,
          }
        : project,
    )

    setProjects(nextProjects)
    savePlaygroundWorkspace({ projects: nextProjects, activeProjectId })
  }, [activeProject, activeProjectId, buildProjectsWithCurrentDraft, projects])

  const deleteProject = useCallback(() => {
    if (projects.length <= 1) {
      return
    }

    const hydratedProjects = buildProjectsWithCurrentDraft(projects)
    const nextProjects = hydratedProjects.filter((project) => project.id !== activeProjectId)
    const fallbackProject = nextProjects[0]
    if (!fallbackProject) {
      return
    }

    setProjects(nextProjects)
    setActiveProjectId(fallbackProject.id)
    setSource(fallbackProject.source)
    syncInputsWithSource(fallbackProject.source, fallbackProject.inputs)
    onRuntimeReset()
    savePlaygroundWorkspace({ projects: nextProjects, activeProjectId: fallbackProject.id })
  }, [activeProjectId, buildProjectsWithCurrentDraft, onRuntimeReset, projects, syncInputsWithSource])

  const handleSourceChange = useCallback((nextSource: string) => {
    setSource(nextSource)
    try {
      const ast = parseProgram(nextSource)
      const fields = extractInputFields(ast)
      setInputs((currentInputs) => keepOnlyExpectedInputs(currentInputs, fields, defaultInputs))
    } catch {
      // keep previous inputs while user edits invalid code
    }
  }, [])

  const loadSelectedExample = useCallback(() => {
    if (!selectedExample) {
      return
    }

    applyProgramTemplate(selectedExample.source, selectedExample.inputs)
  }, [applyProgramTemplate, selectedExample])

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
      const persistedProjects = projects.map((project) =>
        project.id === activeProjectId
          ? {
              ...project,
              source,
              inputs: { ...inputs },
              updatedAt: new Date().toISOString(),
            }
          : project,
      )
      savePlaygroundWorkspace({
        projects: persistedProjects,
        activeProjectId,
      })
    }, AUTOSAVE_DELAY_MS)

    return () => clearTimeout(timeoutId)
  }, [projects, source, inputs, activeProjectId])

  return {
    projects,
    activeProjectId,
    activeProject,
    source,
    inputs,
    selectedExampleId,
    selectedExample,
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
