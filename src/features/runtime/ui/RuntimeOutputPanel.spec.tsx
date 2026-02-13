import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { RuntimeOutputPanel } from '@/features/runtime/ui/RuntimeOutputPanel'

vi.mock('@/features/runtime/ui/output/useRuntimeTracePlayback', () => ({
  useRuntimeTracePlayback: () => ({
    boundedIndex: 0,
    currentStep: null,
    previousStep: null,
    isPlaying: false,
    moveToStep: vi.fn(),
    togglePlayback: vi.fn(),
  }),
}))

vi.mock('@/features/runtime/ui/output/RuntimeTraceControls', () => ({
  RuntimeTraceControls: () => <div>trace-controls</div>,
}))

vi.mock('@/features/runtime/ui/output/RuntimeConsoleCard', () => ({
  RuntimeConsoleCard: () => <div>console-card</div>,
}))

vi.mock('@/features/runtime/ui/output/RuntimeVariablesCard', () => ({
  RuntimeVariablesCard: () => <div>variables-card</div>,
}))

describe('RuntimeOutputPanel', () => {
  it('shows running status', () => {
    render(<RuntimeOutputPanel execution={null} error={null} status="running" />)
    expect(screen.getByText('Ejecutando programa...')).toBeInTheDocument()
  })

  it('renders structured educational error details', () => {
    render(
      <RuntimeOutputPanel
        execution={null}
        status="error"
        error={{
          code: 'PS_TYPE_MISMATCH',
          category: 'type',
          source: 'runtime',
          message: 'La variable edad requiere un Entero.',
          hint: 'La entrada de "edad" debe ser Entero.',
          line: 8,
          context: 'entrada:edad',
        }}
      />,
    )

    expect(screen.getByText('type - PS_TYPE_MISMATCH')).toBeInTheDocument()
    expect(screen.getByText('La variable edad requiere un Entero.')).toBeInTheDocument()
    expect(screen.getByText('Linea: 8')).toBeInTheDocument()
    expect(screen.getByText('Contexto: entrada:edad')).toBeInTheDocument()
    expect(screen.getByText('Sugerencia: La entrada de "edad" debe ser Entero.')).toBeInTheDocument()
  })
})
