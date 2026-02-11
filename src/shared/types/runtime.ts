import type { ProgramAst, RuntimeExecution } from '@/entities/pseint/model/types'

export interface WorkerRunRequest {
  type: 'RUN_PROGRAM'
  payload: {
    source: string
    inputs: Record<string, string>
  }
}

export interface WorkerRunSuccess {
  type: 'RUN_SUCCESS'
  payload: {
    ast: ProgramAst
    execution: RuntimeExecution
    flowchart: string
  }
}

export interface WorkerRunError {
  type: 'RUN_ERROR'
  payload: {
    message: string
  }
}

export type WorkerResponse = WorkerRunSuccess | WorkerRunError
