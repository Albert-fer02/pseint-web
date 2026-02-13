import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createNextProjectName,
  createPlaygroundProject,
  loadPlaygroundWorkspace,
  savePlaygroundWorkspace,
} from '@/features/runtime/model/projects'

const PROJECTS_STORAGE_KEY = 'pseint-lab-projects-v1'
const ACTIVE_PROJECT_STORAGE_KEY = 'pseint-lab-active-project-v1'

describe('projects workspace persistence', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('loads fallback workspace when storage is empty', () => {
    const workspace = loadPlaygroundWorkspace({
      fallbackSource: 'Algoritmo demo\nFinAlgoritmo',
      fallbackInputs: { nombre: 'Ana' },
    })

    expect(workspace.projects).toHaveLength(1)
    expect(workspace.projects[0].source).toContain('Algoritmo demo')
    expect(workspace.activeProjectId).toBe(workspace.projects[0].id)
  })

  it('normalizes malformed persisted projects and input values', () => {
    window.localStorage.setItem(
      PROJECTS_STORAGE_KEY,
      JSON.stringify([
        {
          source: 'Algoritmo A\nFinAlgoritmo',
          inputs: { nombre: 'Ana', edad: 20 },
        },
      ]),
    )

    const workspace = loadPlaygroundWorkspace({
      fallbackSource: 'Algoritmo fallback\nFinAlgoritmo',
      fallbackInputs: {},
    })

    expect(workspace.projects).toHaveLength(1)
    expect(workspace.projects[0].name).toBe('Proyecto 1')
    expect(workspace.projects[0].inputs).toEqual({ nombre: 'Ana', edad: '20' })
  })

  it('falls back safely when storage JSON is corrupted', () => {
    window.localStorage.setItem(PROJECTS_STORAGE_KEY, '{broken')

    const workspace = loadPlaygroundWorkspace({
      fallbackSource: 'Algoritmo safe\nFinAlgoritmo',
      fallbackInputs: { a: '1' },
    })

    expect(workspace.projects[0].source).toContain('Algoritmo safe')
  })

  it('saves workspace and active project id', () => {
    const project = createPlaygroundProject({
      name: 'Proyecto 9',
      source: 'Algoritmo A\nFinAlgoritmo',
      inputs: { nombre: 'Ana' },
    })

    savePlaygroundWorkspace({
      projects: [project],
      activeProjectId: project.id,
    })

    expect(window.localStorage.getItem(ACTIVE_PROJECT_STORAGE_KEY)).toBe(project.id)
    expect(window.localStorage.getItem(PROJECTS_STORAGE_KEY)).toContain('Proyecto 9')
  })

  it('ignores storage write failures', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })

    expect(() =>
      savePlaygroundWorkspace({
        projects: [],
        activeProjectId: 'x',
      }),
    ).not.toThrow()

    expect(spy).toHaveBeenCalled()
  })

  it('creates next default project name without collisions', () => {
    const projects = [{ name: 'Proyecto 1' }, { name: 'Proyecto 2' }, { name: 'Proyecto 4' }].map((entry, index) => ({
      id: `p-${index}`,
      name: entry.name,
      source: 'Algoritmo A\nFinAlgoritmo',
      inputs: {},
      updatedAt: new Date(0).toISOString(),
    }))

    expect(createNextProjectName(projects)).toBe('Proyecto 5')
  })
})
