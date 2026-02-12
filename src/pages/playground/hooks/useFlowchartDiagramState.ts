import { useEffect, useRef, useState } from 'react'

export function useFlowchartDiagramState() {
  const diagramSectionRef = useRef<HTMLDivElement | null>(null)
  const [shouldHydrateDiagram, setShouldHydrateDiagram] = useState(false)
  const [isDiagramExpanded, setIsDiagramExpanded] = useState(false)

  useEffect(() => {
    if (shouldHydrateDiagram || typeof window === 'undefined') {
      return
    }

    if (!('IntersectionObserver' in window)) {
      const timeoutId = setTimeout(() => setShouldHydrateDiagram(true), 0)
      return () => clearTimeout(timeoutId)
    }

    const section = diagramSectionRef.current
    if (!section) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShouldHydrateDiagram(true)
            observer.disconnect()
            break
          }
        }
      },
      { rootMargin: '240px 0px', threshold: 0.05 },
    )

    observer.observe(section)
    return () => observer.disconnect()
  }, [shouldHydrateDiagram])

  useEffect(() => {
    if (!isDiagramExpanded || typeof document === 'undefined') {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isDiagramExpanded])

  return {
    diagramSectionRef,
    shouldHydrateDiagram,
    isDiagramExpanded,
    enableDiagramHydration: () => setShouldHydrateDiagram(true),
    openDiagram: () => {
      setShouldHydrateDiagram(true)
      setIsDiagramExpanded(true)
    },
    closeDiagram: () => setIsDiagramExpanded(false),
  }
}
