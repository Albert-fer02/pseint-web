import { describe, expect, it } from 'vitest'
import { createDefaultPracticeProgressEntry } from '@/features/runtime/model/practiceExercises'
import {
  normalizeSourceForProgress,
  recordPracticeAttempt,
  recordPracticeCreation,
  recordPracticeExecution,
  recordPracticeLearned,
  recordPracticeReflection,
  recordPracticeSolved,
  SOLUTION_REVIEW_MIN_ATTEMPTS,
} from './progressEvents'

describe('practice progress events', () => {
  it('increments attempts and timestamps', () => {
    const entry = createDefaultPracticeProgressEntry()
    const attempted = recordPracticeAttempt(entry, '2026-02-12T00:00:00.000Z')

    expect(attempted.attempts).toBe(1)
    expect(attempted.lastAttemptAt).toBe('2026-02-12T00:00:00.000Z')
  })

  it('requires aprender before practica can complete', () => {
    const entry = createDefaultPracticeProgressEntry()
    const attempted = recordPracticeAttempt(entry, '2026-02-12T00:00:00.000Z')

    expect(attempted.stageCompletedAt.practica).toBeUndefined()

    const learned = recordPracticeLearned(entry, '2026-02-12T00:00:00.000Z')
    const attemptedAfterLearn = recordPracticeAttempt(learned, '2026-02-12T00:01:00.000Z')

    expect(attemptedAfterLearn.stageCompletedAt.practica).toBe('2026-02-12T00:01:00.000Z')
  })

  it('blocks create stage when source equals starter', () => {
    const entry = recordPracticeAttempt(recordPracticeLearned(createDefaultPracticeProgressEntry()), '2026-02-12T00:00:00.000Z')

    const created = recordPracticeCreation(
      entry,
      {
        currentSource: 'Algoritmo A\n Escribir "Hola"\nFinAlgoritmo',
        starterSource: 'Algoritmo A\n Escribir "Hola"\nFinAlgoritmo',
        solutionSource: 'Algoritmo A\n Escribir "Hola Mundo"\nFinAlgoritmo',
      },
      '2026-02-12T00:01:00.000Z',
    )

    expect(created.stageCompletedAt.crea).toBeUndefined()
  })

  it('allows create stage with solution only after minimum attempts', () => {
    let entry = createDefaultPracticeProgressEntry()
    entry = recordPracticeLearned(entry)

    for (let index = 0; index < SOLUTION_REVIEW_MIN_ATTEMPTS; index += 1) {
      entry = recordPracticeAttempt(entry)
    }

    const created = recordPracticeCreation(entry, {
      currentSource: 'solucion',
      starterSource: 'starter',
      solutionSource: 'solucion',
    })

    expect(created.stageCompletedAt.crea).toBeDefined()
  })

  it('solves only after execution stage is available', () => {
    let entry = createDefaultPracticeProgressEntry()
    entry = recordPracticeLearned(entry)
    entry = recordPracticeAttempt(entry)
    entry = recordPracticeCreation(entry, {
      currentSource: 'mi codigo',
      starterSource: 'starter',
      solutionSource: 'solution',
    })
    entry = recordPracticeExecution(entry)
    entry = recordPracticeSolved(entry, '2026-02-12T00:03:00.000Z')

    expect(entry.completed).toBe(true)
    expect(entry.completedAt).toBe('2026-02-12T00:03:00.000Z')
    expect(entry.stageCompletedAt.resuelve).toBe('2026-02-12T00:03:00.000Z')
  })

  it('saves reflection only when valid', () => {
    const entry = recordPracticeReflection(createDefaultPracticeProgressEntry(), 'corto', '2026-02-12T00:04:00.000Z')
    expect(entry.reflectionNote).toBeNull()

    let solved = createDefaultPracticeProgressEntry()
    solved = recordPracticeLearned(solved)
    solved = recordPracticeAttempt(solved)
    solved = recordPracticeCreation(solved, {
      currentSource: 'mi codigo',
      starterSource: 'starter',
      solutionSource: 'solution',
    })
    solved = recordPracticeExecution(solved)
    solved = recordPracticeSolved(solved)

    const withReflection = recordPracticeReflection(
      solved,
      'Aprendi a probar primero el caso base y luego validar salida esperada.',
      '2026-02-12T00:05:00.000Z',
    )

    expect(withReflection.reflectionNote).toContain('Aprendi')
    expect(withReflection.stageCompletedAt.reflexiona).toBe('2026-02-12T00:05:00.000Z')
  })

  it('normalizes whitespace in source comparison', () => {
    expect(normalizeSourceForProgress('  A\n   B   ')).toBe('A B')
  })
})
