import { useCallback } from 'react'
import { defaultInputs, defaultProgram } from '@/features/runtime/model/defaultProgram'
import {
  createNextProjectName,
  createPlaygroundProject,
  savePlaygroundWorkspace,
  type PlaygroundProject,
} from '@/features/runtime/model/projects'

type PlaygroundInputs = Record<string, string>

interface UseWorkspaceProjectActionsArgs {
  projects: PlaygroundProject[]
  activeProjectId: string
  source: string
  inputs: PlaygroundInputs
  setProjects: (projects: PlaygroundProject[]) => void
  setActiveProjectId: (projectId: string) => void
  setSource: (source: string) => void
  syncInputsWithSource: (source: string, fallbackInputs: PlaygroundInputs) => void
  onRuntimeReset: () => void
}

export function useWorkspaceProjectActions({
  projects,
  activeProjectId,
  source,
  inputs,
  setProjects,
  setActiveProjectId,
  setSource,
  syncInputsWithSource,
  onRuntimeReset,
}: UseWorkspaceProjectActionsArgs) {
  const hydrateCurrentDraft = useCallback(
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

  const switchProject = useCallback(
    (nextProjectId: string) => {
      if (nextProjectId === activeProjectId) {
        return
      }

      const hydratedProjects = hydrateCurrentDraft(projects)
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
    [activeProjectId, hydrateCurrentDraft, onRuntimeReset, projects, setActiveProjectId, setProjects, setSource, syncInputsWithSource],
  )

  const createProject = useCallback(() => {
    const hydratedProjects = hydrateCurrentDraft(projects)
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
  }, [hydrateCurrentDraft, onRuntimeReset, projects, setActiveProjectId, setProjects, setSource, syncInputsWithSource])

  const renameProject = useCallback(() => {
    const activeProject = projects.find((project) => project.id === activeProjectId)
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

    const hydratedProjects = hydrateCurrentDraft(projects)
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
  }, [activeProjectId, hydrateCurrentDraft, projects, setProjects])

  const deleteProject = useCallback(() => {
    if (projects.length <= 1) {
      return
    }

    const hydratedProjects = hydrateCurrentDraft(projects)
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
  }, [activeProjectId, hydrateCurrentDraft, onRuntimeReset, projects, setActiveProjectId, setProjects, setSource, syncInputsWithSource])

  return [switchProject, createProject, renameProject, deleteProject, hydrateCurrentDraft] as const
}
