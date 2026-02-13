import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { RuntimeInputsForm } from '@/features/runtime/ui/RuntimeInputsForm'

describe('RuntimeInputsForm', () => {
  it('renders empty message when there are no input fields', () => {
    render(<RuntimeInputsForm fields={[]} values={{}} onChange={vi.fn()} />)
    expect(screen.getByText('Este programa no tiene sentencias Leer.')).toBeInTheDocument()
  })

  it('emits onChange for runtime inputs', () => {
    const onChange = vi.fn()

    render(
      <RuntimeInputsForm
        fields={[{ name: 'edad', varType: 'Entero' }]}
        values={{ edad: '' }}
        onChange={onChange}
      />,
    )

    fireEvent.change(screen.getByPlaceholderText('Ingresa edad'), { target: { value: '18' } })

    expect(onChange).toHaveBeenCalledWith('edad', '18')
    expect(screen.getByText('Entero')).toBeInTheDocument()
  })
})
