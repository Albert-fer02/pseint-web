export interface PlaygroundProject {
  id: string
  name: string
  source: string
  inputs: Record<string, string>
  updatedAt: string
}

interface PlaygroundWorkspaceSnapshot {
  projects: PlaygroundProject[]
  activeProjectId: string
}

const PROJECTS_STORAGE_KEY = 'pseint-lab-projects-v1'
const ACTIVE_PROJECT_STORAGE_KEY = 'pseint-lab-active-project-v1'
const MAX_PROJECTS = 30

export function createPlaygroundProject({
  name,
  source,
  inputs,
}: {
  name: string
  source: string
  inputs: Record<string, string>
}): PlaygroundProject {
  return {
    id: createProjectId(),
    name: name.trim() || 'Proyecto',
    source,
    inputs: { ...inputs },
    updatedAt: new Date().toISOString(),
  }
}

export function loadPlaygroundWorkspace({
  fallbackSource,
  fallbackInputs,
}: {
  fallbackSource: string
  fallbackInputs: Record<string, string>
}): PlaygroundWorkspaceSnapshot {
  const fallbackProject = createPlaygroundProject({
    name: 'Proyecto 1',
    source: fallbackSource,
    inputs: fallbackInputs,
  })

  if (typeof window === 'undefined') {
    return {
      projects: [fallbackProject],
      activeProjectId: fallbackProject.id,
    }
  }

  try {
    const rawProjects = window.localStorage.getItem(PROJECTS_STORAGE_KEY)
    const rawActiveProjectId = window.localStorage.getItem(ACTIVE_PROJECT_STORAGE_KEY)

    if (!rawProjects) {
      return {
        projects: [fallbackProject],
        activeProjectId: fallbackProject.id,
      }
    }

    const parsed = JSON.parse(rawProjects) as unknown
    if (!Array.isArray(parsed)) {
      return {
        projects: [fallbackProject],
        activeProjectId: fallbackProject.id,
      }
    }

    const normalizedProjects = parsed
      .map((project, index) => normalizeProject(project, index))
      .filter((project): project is PlaygroundProject => Boolean(project))
      .slice(0, MAX_PROJECTS)

    if (normalizedProjects.length === 0) {
      return {
        projects: [fallbackProject],
        activeProjectId: fallbackProject.id,
      }
    }

    const activeProjectId = normalizedProjects.some((project) => project.id === rawActiveProjectId)
      ? (rawActiveProjectId as string)
      : normalizedProjects[0].id

    return {
      projects: normalizedProjects,
      activeProjectId,
    }
  } catch {
    return {
      projects: [fallbackProject],
      activeProjectId: fallbackProject.id,
    }
  }
}

export function savePlaygroundWorkspace({
  projects,
  activeProjectId,
}: {
  projects: PlaygroundProject[]
  activeProjectId: string
}): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const normalizedProjects = projects.slice(0, MAX_PROJECTS)
    window.localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(normalizedProjects))
    window.localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, activeProjectId)
  } catch {
    // ignore storage failures in restricted browsers
  }
}

export function createNextProjectName(projects: PlaygroundProject[]): string {
  let candidateNumber = projects.length + 1
  const existingNames = new Set(projects.map((project) => project.name.toLowerCase()))

  while (existingNames.has(`proyecto ${candidateNumber}`)) {
    candidateNumber += 1
  }

  return `Proyecto ${candidateNumber}`
}

function createProjectId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `project-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function normalizeProject(rawProject: unknown, index: number): PlaygroundProject | null {
  if (!isRecord(rawProject)) {
    return null
  }

  if (typeof rawProject.source !== 'string' || !isRecord(rawProject.inputs)) {
    return null
  }

  const normalizedInputs = Object.fromEntries(
    Object.entries(rawProject.inputs)
      .filter((entry): entry is [string, unknown] => typeof entry[0] === 'string')
      .map(([key, value]) => [key, typeof value === 'string' ? value : String(value ?? '')]),
  )

  return {
    id: typeof rawProject.id === 'string' && rawProject.id.trim().length > 0 ? rawProject.id : `legacy-${index}`,
    name: typeof rawProject.name === 'string' && rawProject.name.trim().length > 0 ? rawProject.name : `Proyecto ${index + 1}`,
    source: rawProject.source,
    inputs: normalizedInputs,
    updatedAt: typeof rawProject.updatedAt === 'string' ? rawProject.updatedAt : new Date(0).toISOString(),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
