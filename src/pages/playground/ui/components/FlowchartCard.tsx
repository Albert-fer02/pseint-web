import { lazy, Suspense } from 'react'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'

const MermaidChart = lazy(() => import('@/shared/lib/mermaid/MermaidChart'))

interface FlowchartCardProps {
  cardId: string
  cardClassName: string
  ariaLabelledBy?: string
  flowchartPreview: string | null
  parserError: string | null
  shouldRenderDiagram: boolean
  shouldHydrateDiagram: boolean
  onEnableHydration: () => void
  onExpand: () => void
}

export function FlowchartCard({
  cardId,
  cardClassName,
  ariaLabelledBy,
  flowchartPreview,
  parserError,
  shouldRenderDiagram,
  shouldHydrateDiagram,
  onEnableHydration,
  onExpand,
}: FlowchartCardProps) {
  return (
    <Card id={cardId} className={cardClassName} role="tabpanel" aria-labelledby={ariaLabelledBy}>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-1">
            <CardTitle>Diagrama de flujo</CardTitle>
            <CardDescription>Se actualiza automaticamente al cambiar el codigo.</CardDescription>
          </div>
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onExpand} disabled={!flowchartPreview}>
            Expandir diagrama
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {flowchartPreview && shouldRenderDiagram && shouldHydrateDiagram ? (
          <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando renderer de diagramas...</p>}>
            <MermaidChart chart={flowchartPreview} />
          </Suspense>
        ) : flowchartPreview && !shouldHydrateDiagram ? (
          <div className="space-y-3 rounded-xl border border-border/80 bg-muted/20 p-4">
            <p className="text-sm text-muted-foreground">Carga el diagrama cuando lo necesites para mejorar rendimiento.</p>
            <Button type="button" variant="outline" onClick={onEnableHydration}>
              Ver diagrama
            </Button>
          </div>
        ) : flowchartPreview ? (
          <p className="text-sm text-muted-foreground">Selecciona este panel para visualizar el diagrama.</p>
        ) : parserError ? (
          <p className="text-sm text-muted-foreground">Corrige el codigo para generar el diagrama.</p>
        ) : (
          <p className="text-sm text-muted-foreground">Escribe un algoritmo para construir el diagrama de flujo.</p>
        )}
      </CardContent>
    </Card>
  )
}
