/// <reference lib="webworker" />
import { buildFlowchart } from '@/shared/lib/pseint/flowchart'
import { executeProgram } from '@/shared/lib/pseint/interpreter'
import { parseProgram } from '@/shared/lib/pseint/parser'
import type { WorkerResponse, WorkerRunRequest } from '@/shared/types/runtime'

self.onmessage = (event: MessageEvent<WorkerRunRequest>) => {
  const request = event.data

  if (request.type !== 'RUN_PROGRAM') {
    const response: WorkerResponse = {
      type: 'RUN_ERROR',
      payload: { message: 'Tipo de evento no soportado.' },
    }
    self.postMessage(response)
    return
  }

  try {
    const ast = parseProgram(request.payload.source)
    const execution = executeProgram(ast, request.payload.inputs)
    const flowchart = buildFlowchart(ast)

    const response: WorkerResponse = {
      type: 'RUN_SUCCESS',
      payload: {
        ast,
        execution,
        flowchart,
      },
    }

    self.postMessage(response)
  } catch (error) {
    const response: WorkerResponse = {
      type: 'RUN_ERROR',
      payload: {
        message: error instanceof Error ? error.message : 'Error desconocido de runtime.',
      },
    }
    self.postMessage(response)
  }
}

export {}
