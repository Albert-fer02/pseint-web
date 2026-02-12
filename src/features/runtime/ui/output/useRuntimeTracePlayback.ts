import { useEffect, useState } from 'react'
import type { RuntimeExecution } from '@/entities/pseint/model/types'

const STEP_PLAYBACK_INTERVAL_MS = 700

interface UseRuntimeTracePlaybackResult {
  traceVersion: string
  traceLength: number
  boundedIndex: number
  currentStep: RuntimeExecution['trace'][number] | null
  previousStep: RuntimeExecution['trace'][number] | null
  isPlaying: boolean
  moveToStep: (nextIndex: number) => void
  togglePlayback: () => void
}

export function useRuntimeTracePlayback(execution: RuntimeExecution | null): UseRuntimeTracePlaybackResult {
  const [traceCursor, setTraceCursor] = useState<{ version: string; index: number }>({
    version: 'none',
    index: 0,
  })
  const [playback, setPlayback] = useState<{ version: string; active: boolean }>({
    version: 'none',
    active: false,
  })

  const traceVersion = execution
    ? `${execution.stepsExecuted}:${execution.trace.length}:${execution.outputs.length}`
    : 'none'
  const traceLength = execution?.trace.length ?? 0
  const fallbackIndex = Math.max(0, traceLength - 1)

  const activeStepIndex = execution
    ? traceCursor.version === traceVersion
      ? traceCursor.index
      : fallbackIndex
    : 0

  const boundedIndex = execution
    ? Math.min(Math.max(activeStepIndex, 0), fallbackIndex)
    : 0

  const isPlaying = playback.active && playback.version === traceVersion

  useEffect(() => {
    if (!execution || !isPlaying || traceLength === 0 || boundedIndex >= traceLength - 1) {
      return
    }

    const timerId = window.setInterval(() => {
      setTraceCursor((previousCursor) => {
        const previousIndex = previousCursor.version === traceVersion ? previousCursor.index : boundedIndex
        const nextIndex = Math.min(traceLength - 1, previousIndex + 1)

        if (nextIndex >= traceLength - 1) {
          setPlayback({ version: traceVersion, active: false })
        }

        return {
          version: traceVersion,
          index: nextIndex,
        }
      })
    }, STEP_PLAYBACK_INTERVAL_MS)

    return () => window.clearInterval(timerId)
  }, [execution, isPlaying, traceLength, boundedIndex, traceVersion])

  const moveToStep = (nextIndex: number) => {
    if (!execution || traceLength === 0) {
      return
    }

    const clampedIndex = Math.min(Math.max(nextIndex, 0), traceLength - 1)
    setTraceCursor({ version: traceVersion, index: clampedIndex })
    setPlayback({ version: traceVersion, active: false })
  }

  const togglePlayback = () => {
    if (!execution || traceLength === 0) {
      return
    }

    if (isPlaying) {
      setPlayback({ version: traceVersion, active: false })
      return
    }

    const startIndex = boundedIndex >= traceLength - 1 ? 0 : boundedIndex
    setTraceCursor({ version: traceVersion, index: startIndex })
    setPlayback({ version: traceVersion, active: true })
  }

  return {
    traceVersion,
    traceLength,
    boundedIndex,
    currentStep: execution?.trace[boundedIndex] ?? null,
    previousStep: execution?.trace[boundedIndex - 1] ?? null,
    isPlaying,
    moveToStep,
    togglePlayback,
  }
}
