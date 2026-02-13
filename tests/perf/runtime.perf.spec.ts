import { describe, expect, it } from 'vitest'
import { defaultInputs, defaultProgram } from '@/features/runtime/model/defaultProgram'
import { executeProgram } from '@/shared/lib/pseint/interpreter'
import { parseProgram } from '@/shared/lib/pseint/parser'

interface PerfCase {
  name: string
  source: string
  inputs: Record<string, string>
  iterations: number
}

interface PerfStats {
  name: string
  iterations: number
  avgMs: number
  p50Ms: number
  p95Ms: number
}

const heavyLoopProgram = `Algoritmo HeavyLoop
Definir i, j, suma Como Entero;
suma <- 0;
Para i <- 1 Hasta 160 Con Paso 1 Hacer
  Para j <- 1 Hasta 90 Con Paso 1 Hacer
    suma <- suma + i + j;
  FinPara
FinPara
Escribir "suma:", suma;
FinAlgoritmo`

const cases: PerfCase[] = [
  { name: 'default-program', source: defaultProgram, inputs: defaultInputs, iterations: 80 },
  {
    name: 'compare-two-numbers',
    source: `Algoritmo Comparar
Definir num1, num2 Como Real;
Leer num1;
Leer num2;
Si num1 > num2 Entonces
  Escribir "num1";
Sino
  Escribir "num2";
FinSi
FinAlgoritmo`,
    inputs: { num1: '8', num2: '4' },
    iterations: 80,
  },
  { name: 'heavy-loop', source: heavyLoopProgram, inputs: {}, iterations: 40 },
]

describe('runtime performance report', () => {
  it(
    'prints parser+runtime timing stats for real and synthetic workloads',
    () => {
      const stats = cases.map(runCase)

      console.table(
        stats.map((stat) => ({
          case: stat.name,
          iter: stat.iterations,
          avg_ms: stat.avgMs,
          p50_ms: stat.p50Ms,
          p95_ms: stat.p95Ms,
        })),
      )

      // Keep this test deterministic: fail only if runtime is broken, not due machine speed variance.
      expect(stats.every((stat) => stat.iterations > 0 && Number.isFinite(stat.avgMs))).toBe(true)
    },
    60_000,
  )
})

function runCase(testCase: PerfCase): PerfStats {
  for (let warmup = 0; warmup < 5; warmup += 1) {
    const ast = parseProgram(testCase.source)
    executeProgram(ast, testCase.inputs)
  }

  const samples: number[] = []
  for (let runIndex = 0; runIndex < testCase.iterations; runIndex += 1) {
    const startedAt = performance.now()
    const ast = parseProgram(testCase.source)
    executeProgram(ast, testCase.inputs)
    samples.push(performance.now() - startedAt)
  }

  samples.sort((a, b) => a - b)

  return {
    name: testCase.name,
    iterations: testCase.iterations,
    avgMs: round2(samples.reduce((acc, value) => acc + value, 0) / samples.length),
    p50Ms: round2(percentile(samples, 0.5)),
    p95Ms: round2(percentile(samples, 0.95)),
  }
}

function percentile(sortedValues: number[], ratio: number): number {
  if (sortedValues.length === 0) {
    return 0
  }

  const index = Math.min(sortedValues.length - 1, Math.floor(sortedValues.length * ratio))
  return sortedValues[index] ?? 0
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}
