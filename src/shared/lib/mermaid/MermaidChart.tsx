import mermaid from 'mermaid/dist/mermaid.core.mjs'
import { useEffect, useMemo, useState } from 'react'
import { useTheme } from '@/app/providers/ThemeProvider'

interface MermaidChartProps {
  chart: string
}

export function MermaidChart({ chart }: MermaidChartProps) {
  const { theme } = useTheme()
  const [svg, setSvg] = useState('')
  const [error, setError] = useState<string | null>(null)
  const chartId = useMemo(() => `mermaid-${crypto.randomUUID()}`, [])

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

  return <div className="mermaid-chart" dangerouslySetInnerHTML={{ __html: svg }} />
}

export default MermaidChart
