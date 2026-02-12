import { useEffect, useRef } from 'react'
import { getMobilePanelSectionId, type MobilePanelKey } from '@/pages/playground/model/playgroundUiConfig'

export function useMobilePanelAutoScroll(mobilePanel: MobilePanelKey) {
  const hasMountedRef = useRef(false)

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      return
    }

    if (typeof window === 'undefined' || window.matchMedia('(min-width: 768px)').matches) {
      return
    }

    const target = document.getElementById(getMobilePanelSectionId(mobilePanel))
    if (!target) {
      return
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    target.scrollIntoView({
      block: 'start',
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    })
  }, [mobilePanel])
}
