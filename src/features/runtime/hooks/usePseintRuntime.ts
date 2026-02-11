import { useCallback, useState } from 'react'
import type { ProgramAst, RuntimeExecution } from '@/entities/pseint/model/types'
import type { WorkerResponse, WorkerRunRequest } from '@/shared/types/runtime'

interface RuntimeSuccess {
  ast: ProgramAst
  execution: RuntimeExecution
  flowchart: string
}

type RuntimeStatus = 'idle' | 'running' | 'success' | 'error'

export function usePseintRuntime() {
  const [status, setStatus] = useState<RuntimeStatus>('idle')
  const [result, setResult] = useState<RuntimeSuccess | null>(null)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(async (source: string, inputs: Record<string, string>) => {
    setStatus('running')
    setResult(null)
    setError(null)

    const worker = new Worker(new URL('@/workers/pseintRuntime.worker.ts', import.meta.url), {
      type: 'module',
    })

    const payload: WorkerRunRequest = {
      type: 'RUN_PROGRAM',
      payload: {
        source,
        inputs,
      },
    }

    return new Promise<RuntimeSuccess>((resolve, reject) => {
      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const response = event.data

        if (response.type === 'RUN_SUCCESS') {
          setStatus('success')
          setResult(response.payload)
          setError(null)
          worker.terminate()
          resolve(response.payload)
          return
        }

        setStatus('error')
        setResult(null)
        setError(response.payload.message)
        worker.terminate()
        reject(new Error(response.payload.message))
      }

      worker.onerror = (event) => {
        const errorMessage = event.message || 'Error desconocido al ejecutar el programa.'
        setStatus('error')
        setResult(null)
        setError(errorMessage)
        worker.terminate()
        reject(new Error(errorMessage))
      }

      worker.postMessage(payload)
    })
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setResult(null)
    setError(null)
  }, [])

  return {
    run,
    reset,
    status,
    result,
    error,
  }
}
