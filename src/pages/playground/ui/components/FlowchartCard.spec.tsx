import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FlowchartCard } from '@/pages/playground/ui/components/FlowchartCard'

describe('FlowchartCard', () => {
  it('shows hydration button when preview exists but hydration is disabled', () => {
    const onEnableHydration = vi.fn()

    render(
      <FlowchartCard
        cardId="diagram"
        cardClassName=""
        flowchartPreview="flowchart TD\nA-->B"
        parserError={null}
        shouldRenderDiagram
        shouldHydrateDiagram={false}
        onEnableHydration={onEnableHydration}
        onExpand={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Ver diagrama' }))
    expect(onEnableHydration).toHaveBeenCalledTimes(1)
  })

  it('shows parser guidance when flowchart cannot be generated', () => {
    render(
      <FlowchartCard
        cardId="diagram"
        cardClassName=""
        flowchartPreview={null}
        parserError="Linea 2: Error"
        shouldRenderDiagram
        shouldHydrateDiagram
        onEnableHydration={vi.fn()}
        onExpand={vi.fn()}
      />,
    )

    expect(screen.getByText('Corrige el codigo para generar el diagrama.')).toBeInTheDocument()
  })
})
