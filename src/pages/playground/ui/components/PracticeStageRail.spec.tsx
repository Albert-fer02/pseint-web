import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  createDefaultPracticeProgressEntry,
  practiceStageFlow,
} from '@/features/runtime/model/practiceExercises'
import { PracticeStageRail } from '@/pages/playground/ui/components/PracticeStageRail'

describe('PracticeStageRail', () => {
  it('renders completed count and progress width', () => {
    const progress = createDefaultPracticeProgressEntry()
    progress.stageCompletedAt.aprende = '2026-02-12T00:00:00.000Z'
    progress.stageCompletedAt.practica = '2026-02-12T00:01:00.000Z'

    const { container } = render(
      <PracticeStageRail
        stageFlow={practiceStageFlow}
        selectedProgress={progress}
      />,
    )

    expect(screen.getByText('2/6 etapas')).toBeInTheDocument()

    const progressBar = container.querySelector('.bg-primary') as HTMLDivElement | null
    expect(progressBar).not.toBeNull()
    expect(progressBar?.style.width).toBe('33%')
  })
})
