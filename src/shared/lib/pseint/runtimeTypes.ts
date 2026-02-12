import type {
  ProgramAst,
  ProgramDeclaration,
  ProgramFunction,
  ProgramProcedure,
  RuntimeScalar,
  RuntimeStepSnapshot,
  RuntimeValue,
} from '@/entities/pseint/model/types'

export interface RuntimeMetrics {
  outputs: string[]
  stepsExecuted: number
  currentLine: string | null
  trace: RuntimeStepSnapshot[]
  traceTruncated: boolean
}

export interface RuntimeContext {
  program: ProgramAst
  functions: Map<string, ProgramFunction>
  procedures: Map<string, ProgramProcedure>
  declarations: Map<string, ProgramDeclaration>
  constants: Map<string, RuntimeScalar>
  variables: Record<string, RuntimeValue>
  inputs: Record<string, string>
  metrics: RuntimeMetrics
  parent: RuntimeContext | null
}
