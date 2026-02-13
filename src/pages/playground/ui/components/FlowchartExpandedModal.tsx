import { lazy, Suspense, useEffect, useId, useRef } from 'react'
import { Button } from '@/shared/ui/button'

const MermaidChart = lazy(() => import('@/shared/lib/mermaid/MermaidChart'))

interface FlowchartExpandedModalProps {
  open: boolean
  flowchartPreview: string | null
  onClose: () => void
}

export function FlowchartExpandedModal({ open, flowchartPreview, onClose }: FlowchartExpandedModalProps) {
  const titleId = useId()
  const descriptionId = useId()
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!open || !flowchartPreview) {
      return
    }

    const previousElement = document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeButtonRef.current?.focus()

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab') {
        return
      }

      const container = dialogRef.current
      if (!container) {
        return
      }

      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
      ).filter((element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true')

      if (focusable.length === 0) {
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }

      if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      }
    }

    document.addEventListener('keydown', handleKeydown)

    return () => {
      document.removeEventListener('keydown', handleKeydown)
      previousElement?.focus()
    }
  }, [flowchartPreview, onClose, open])

  if (!open || !flowchartPreview) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/95 p-3 backdrop-blur-sm md:p-5">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="mx-auto flex h-full w-full max-w-5xl flex-col rounded-2xl border border-border bg-card shadow-[0_24px_56px_rgba(2,6,23,0.28)]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="space-y-0.5">
            <p id={titleId} className="text-sm font-semibold text-foreground">Diagrama en vista ampliada</p>
            <p id={descriptionId} className="text-xs text-muted-foreground">En mobile puedes desplazar horizontalmente para leer nodos grandes.</p>
          </div>
          <Button ref={closeButtonRef} type="button" variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto bg-muted/20 p-3 md:p-5">
          <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando renderer de diagramas...</p>}>
            <MermaidChart chart={flowchartPreview} expanded />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
