import type { ProgramAst, ProgramInsights, Statement } from '@/entities/pseint/model/types'

interface StatementStats {
  reads: number
  writes: number
  assignments: number
  conditionals: number
  loops: number
  statementCount: number
  maxNesting: number
}

interface SourceMetrics {
  totalLines: number
  codeLines: number
  commentLines: number
}

export function analyzeProgram(source: string, ast: ProgramAst): ProgramInsights {
  const sourceMetrics = analyzeSource(source)
  const statementStats = collectStatementStats(ast.statements)

  const cyclomaticComplexity = statementStats.conditionals + statementStats.loops + 1
  const complexityScore = Math.min(
    10,
    Number((
      1 +
      statementStats.conditionals * 1.6 +
      statementStats.loops * 2.2 +
      Math.max(0, statementStats.maxNesting - 1) * 1.7 +
      statementStats.statementCount / 12
    ).toFixed(1)),
  )

  const complexityBand = classifyComplexityBand(complexityScore)
  const estimatedLevel = classifyProgramLevel({
    cyclomaticComplexity,
    maxNesting: statementStats.maxNesting,
    statementCount: statementStats.statementCount,
    loops: statementStats.loops,
  })

  return {
    totalLines: sourceMetrics.totalLines,
    codeLines: sourceMetrics.codeLines,
    commentLines: sourceMetrics.commentLines,
    declarationCount: ast.declarations.length,
    readCount: statementStats.reads,
    writeCount: statementStats.writes,
    assignmentCount: statementStats.assignments,
    conditionalCount: statementStats.conditionals,
    loopCount: statementStats.loops,
    maxNesting: statementStats.maxNesting,
    statementCount: statementStats.statementCount,
    cyclomaticComplexity,
    complexityScore,
    complexityBand,
    estimatedLevel,
    timeComplexity: estimateTimeComplexity(statementStats),
    guidance: buildGuidance({
      sourceMetrics,
      cyclomaticComplexity,
      statementStats,
      estimatedLevel,
    }),
  }
}

function collectStatementStats(statements: Statement[], depth = 1): StatementStats {
  const result: StatementStats = {
    reads: 0,
    writes: 0,
    assignments: 0,
    conditionals: 0,
    loops: 0,
    statementCount: 0,
    maxNesting: 0,
  }

  for (const statement of statements) {
    result.statementCount += 1

    if (statement.kind === 'read') {
      result.reads += 1
      continue
    }

    if (statement.kind === 'write') {
      result.writes += 1
      continue
    }

    if (statement.kind === 'assign') {
      result.assignments += 1
      continue
    }

    if (statement.kind === 'call') {
      continue
    }

    if (statement.kind === 'if') {
      result.conditionals += 1
      result.maxNesting = Math.max(result.maxNesting, depth)

      const thenStats = collectStatementStats(statement.thenBranch, depth + 1)
      const elseStats = collectStatementStats(statement.elseBranch, depth + 1)

      mergeStats(result, thenStats)
      mergeStats(result, elseStats)
      continue
    }

    if (statement.kind === 'for' || statement.kind === 'while' || statement.kind === 'repeatUntil') {
      result.loops += 1
      result.maxNesting = Math.max(result.maxNesting, depth)
      const bodyStats = collectStatementStats(statement.body, depth + 1)
      mergeStats(result, bodyStats)
      continue
    }

    if (statement.kind === 'switch') {
      result.conditionals += 1
      result.maxNesting = Math.max(result.maxNesting, depth)
      for (const caseBranch of statement.cases) {
        const caseStats = collectStatementStats(caseBranch.body, depth + 1)
        mergeStats(result, caseStats)
      }
      const defaultStats = collectStatementStats(statement.defaultBranch, depth + 1)
      mergeStats(result, defaultStats)
    }
  }

  return result
}

function mergeStats(target: StatementStats, source: StatementStats): void {
  target.reads += source.reads
  target.writes += source.writes
  target.assignments += source.assignments
  target.conditionals += source.conditionals
  target.loops += source.loops
  target.statementCount += source.statementCount
  target.maxNesting = Math.max(target.maxNesting, source.maxNesting)
}

function analyzeSource(source: string): SourceMetrics {
  const lines = source.split(/\r?\n/)
  let codeLines = 0
  let commentLines = 0

  for (const rawLine of lines) {
    const trimmed = rawLine.trim()
    if (!trimmed) {
      continue
    }

    if (trimmed.startsWith('//')) {
      commentLines += 1
      continue
    }

    codeLines += 1
  }

  return {
    totalLines: lines.length,
    codeLines,
    commentLines,
  }
}

function classifyComplexityBand(score: number): ProgramInsights['complexityBand'] {
  if (score <= 4) {
    return 'Baja'
  }
  if (score <= 7) {
    return 'Media'
  }
  return 'Alta'
}

function classifyProgramLevel({
  cyclomaticComplexity,
  maxNesting,
  statementCount,
  loops,
}: {
  cyclomaticComplexity: number
  maxNesting: number
  statementCount: number
  loops: number
}): ProgramInsights['estimatedLevel'] {
  if (cyclomaticComplexity <= 2 && maxNesting <= 1 && statementCount <= 12 && loops === 0) {
    return 'Basico'
  }

  if (cyclomaticComplexity <= 5 && maxNesting <= 2 && statementCount <= 35 && loops <= 2) {
    return 'Intermedio'
  }

  return 'Avanzado'
}

function estimateTimeComplexity(stats: StatementStats): string {
  if (stats.loops === 0) {
    return 'O(1) (sin ciclos en el subset actual)'
  }

  if (stats.loops === 1 && stats.maxNesting <= 1) {
    return 'O(n) aproximado (un ciclo lineal)'
  }

  if (stats.maxNesting >= 2) {
    return 'O(n^2) o mayor (ciclos anidados detectados)'
  }

  return 'O(n) a O(n^2) (depende de limites y datos)'
}

function buildGuidance({
  sourceMetrics,
  cyclomaticComplexity,
  statementStats,
  estimatedLevel,
}: {
  sourceMetrics: SourceMetrics
  cyclomaticComplexity: number
  statementStats: StatementStats
  estimatedLevel: ProgramInsights['estimatedLevel']
}): string[] {
  const guidance: string[] = []

  guidance.push(`Nivel estimado: ${estimatedLevel}.`)

  if (statementStats.maxNesting >= 3) {
    guidance.push('Reduci la anidacion de condicionales/ciclos para mejorar legibilidad.')
  }

  if (cyclomaticComplexity >= 6) {
    guidance.push('La complejidad ciclomatica es alta; considera dividir en subalgoritmos.')
  }

  if (statementStats.loops > 0) {
    guidance.push('Documenta el proposito del ciclo y valida limites para evitar bucles infinitos.')
  }

  if (sourceMetrics.commentLines === 0) {
    guidance.push('Agrega comentarios en bloques clave para que otra persona lo entienda mas rapido.')
  }

  if (statementStats.reads > 0 && statementStats.writes === 0) {
    guidance.push('El algoritmo lee datos pero no muestra salida; agrega al menos un Escribir.')
  }

  if (sourceMetrics.codeLines > 45) {
    guidance.push('El algoritmo ya es extenso; conviene modularizar en procedimientos.')
  }

  if (guidance.length === 1) {
    guidance.push('Buena base: el flujo es simple y apto para aprendizaje inicial.')
  }

  return guidance
}
