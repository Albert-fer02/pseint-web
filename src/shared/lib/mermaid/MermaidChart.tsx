import mermaid from 'mermaid/dist/mermaid.core.mjs'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { WheelEvent } from 'react'
import { useTheme } from '@/app/providers/ThemeProvider'
import { Button } from '@/shared/ui/button'

interface MermaidChartProps {
  chart: string
  expanded?: boolean
}

const MIN_ZOOM = 0.45
const MAX_ZOOM = 3
const ZOOM_STEP = 0.15

export function MermaidChart({ chart, expanded = false }: MermaidChartProps) {
  const { theme } = useTheme()
  const [svg, setSvg] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const chartId = useMemo(() => `mermaid-${crypto.randomUUID()}`, [])
  const baseWidth = useMemo(() => extractSvgBaseWidth(svg), [svg])

  useEffect(() => {
    let isDisposed = false

    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'loose',
      theme: theme === 'oled' ? 'dark' : 'default',
    })

    const renderChart = async () => {
      try {
        const { svg: renderedSvg } = await mermaid.render(chartId, chart)
        if (!isDisposed) {
          setSvg(renderedSvg)
          setError(null)
          setZoom(1)
        }
      } catch (renderError) {
        if (!isDisposed) {
          setError(renderError instanceof Error ? renderError.message : 'No se pudo renderizar el diagrama.')
          setSvg('')
        }
      }
    }

    void renderChart()

    return () => {
      isDisposed = true
    }
  }, [chart, chartId, theme])

  const applyZoom = useCallback((nextZoom: number) => {
    setZoom(clampZoom(nextZoom))
  }, [])

  const fitToWidth = useCallback(() => {
    if (!baseWidth || !viewportRef.current) {
      return
    }
    const viewportWidth = viewportRef.current.clientWidth - 12
    if (viewportWidth <= 0) {
      return
    }
    applyZoom(viewportWidth / baseWidth)
    viewportRef.current.scrollTo({ left: 0, top: 0, behavior: 'smooth' })
  }, [applyZoom, baseWidth])

  const resetView = useCallback(() => {
    setZoom(1)
    viewportRef.current?.scrollTo({ left: 0, top: 0, behavior: 'smooth' })
  }, [])

  const handleWheelZoom = useCallback(
    (event: WheelEvent<HTMLDivElement>) => {
      if (!event.ctrlKey && !event.metaKey) {
        return
      }
      event.preventDefault()
      const direction = event.deltaY < 0 ? 1 : -1
      applyZoom(zoom + direction * ZOOM_STEP)
    },
    [applyZoom, zoom],
  )

  const downloadSvg = useCallback(() => {
    if (!svg) {
      return
    }

    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    const objectUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = `diagrama-${new Date().toISOString().slice(0, 10)}.svg`
    anchor.click()
    URL.revokeObjectURL(objectUrl)
  }, [svg])

  if (error) {
    return (
      <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        Error de Mermaid: {error}
      </p>
    )
  }

  if (!svg) {
    return <p className="text-sm text-muted-foreground">Generando diagrama...</p>
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => applyZoom(zoom - ZOOM_STEP)} aria-label="Alejar diagrama">
          -
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={resetView} aria-label="Restaurar zoom al 100%">
          100%
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => applyZoom(zoom + ZOOM_STEP)} aria-label="Acercar diagrama">
          +
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={fitToWidth}>
          Ajustar ancho
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={downloadSvg}>
          Descargar SVG
        </Button>
        <span className="text-xs text-muted-foreground">Zoom: {Math.round(zoom * 100)}%</span>
      </div>

      <div
        ref={viewportRef}
        className={`mermaid-chart rounded-xl border border-border bg-muted/15 p-2 md:p-3 ${expanded ? 'h-full max-h-none' : 'max-h-[min(72vh,38rem)]'}`}
        onWheel={handleWheelZoom}
      >
        <div
          className="mermaid-stage mx-auto"
          style={
            baseWidth
              ? {
                  width: `${Math.max(220, baseWidth * zoom)}px`,
                }
              : {
                  width: `${zoom * 100}%`,
                }
          }
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Tip: usa Ctrl/Cmd + rueda para zoom rapido, y desplaza para navegar el diagrama.
      </p>
    </div>
  )
}

export default MermaidChart

function clampZoom(value: number): number {
  if (value < MIN_ZOOM) {
    return MIN_ZOOM
  }
  if (value > MAX_ZOOM) {
    return MAX_ZOOM
  }
  return value
}

function extractSvgBaseWidth(svg: string): number | null {
  if (!svg) {
    return null
  }

  const viewBoxMatch = svg.match(/viewBox=['"]([^'"]+)['"]/i)
  if (viewBoxMatch?.[1]) {
    const values = viewBoxMatch[1]
      .split(/[\s,]+/)
      .map((value) => Number.parseFloat(value))
      .filter((value) => Number.isFinite(value))
    if (values.length >= 4 && values[2] && values[2] > 0) {
      return values[2]
    }
  }

  const widthMatch = svg.match(/width=['"]([\d.]+)(px)?['"]/i)
  if (widthMatch?.[1]) {
    const width = Number.parseFloat(widthMatch[1])
    if (Number.isFinite(width) && width > 0) {
      return width
    }
  }

  return null
}
