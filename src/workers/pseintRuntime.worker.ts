/// <reference lib="webworker" />
import { buildFlowchart } from '@/shared/lib/pseint/flowchart'
import { executeProgram } from '@/shared/lib/pseint/interpreter'
import { parseProgram } from '@/shared/lib/pseint/parser'
import { toPseintErrorDescriptor } from '@/shared/lib/pseint/runtimeError'
import type { WorkerResponse, WorkerRunRequest } from '@/shared/types/runtime'

self.onmessage = (event: MessageEvent<WorkerRunRequest>) => {
  const request = event.data

  if (request.type !== 'RUN_PROGRAM') {
    const unsupportedEventError = toPseintErrorDescriptor(new Error('Tipo de evento no soportado.'))
    const response: WorkerResponse = {
      type: 'RUN_ERROR',
      payload: {
        message: unsupportedEventError.message,
        error: unsupportedEventError,
      },
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
  } catch (runtimeError) {
    const descriptor = toPseintErrorDescriptor(runtimeError)
    const response: WorkerResponse = {
      type: 'RUN_ERROR',
      payload: {
        message: descriptor.message,
        error: descriptor,
      },
    }
    self.postMessage(response)
  }
}

export {}
