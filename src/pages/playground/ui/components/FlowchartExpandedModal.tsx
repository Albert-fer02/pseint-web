import { lazy, Suspense } from 'react'
import { Button } from '@/shared/ui/button'

const MermaidChart = lazy(() => import('@/shared/lib/mermaid/MermaidChart'))

interface FlowchartExpandedModalProps {
  open: boolean
  flowchartPreview: string | null
  onClose: () => void
}

export function FlowchartExpandedModal({ open, flowchartPreview, onClose }: FlowchartExpandedModalProps) {
  if (!open || !flowchartPreview) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/95 p-3 backdrop-blur-sm md:p-5">
      <div className="mx-auto flex h-full w-full max-w-5xl flex-col rounded-2xl border border-border bg-card shadow-[0_24px_56px_rgba(2,6,23,0.28)]">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-foreground">Diagrama en vista ampliada</p>
            <p className="text-xs text-muted-foreground">En mobile puedes desplazar horizontalmente para leer nodos grandes.</p>
          </div>
          <Button type="button" variant="outline" onClick={onClose}>
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
