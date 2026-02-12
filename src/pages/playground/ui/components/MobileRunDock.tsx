import { useEffect, useState } from 'react'
import { MOBILE_KEYBOARD_DELTA_THRESHOLD } from '@/pages/playground/model/playgroundUiConfig'
import { Button } from '@/shared/ui/button'

interface MobileRunDockProps {
  onRun: () => Promise<void>
  disabled: boolean
  statusText: string
  hasParserError: boolean
}

export function MobileRunDock({ onRun, disabled, statusText, hasParserError }: MobileRunDockProps) {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const viewport = window.visualViewport
    if (!viewport) {
      return
    }

    const updateKeyboardState = () => {
      const active = document.activeElement
      const isTypingTarget = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || active instanceof HTMLSelectElement
      const viewportDelta = window.innerHeight - viewport.height
      const keyboardLikelyVisible = viewportDelta > MOBILE_KEYBOARD_DELTA_THRESHOLD
      setIsKeyboardOpen(isTypingTarget && keyboardLikelyVisible)
    }

    updateKeyboardState()
    viewport.addEventListener('resize', updateKeyboardState)
    viewport.addEventListener('scroll', updateKeyboardState)
    window.addEventListener('focusin', updateKeyboardState)
    window.addEventListener('focusout', updateKeyboardState)

    return () => {
      viewport.removeEventListener('resize', updateKeyboardState)
      viewport.removeEventListener('scroll', updateKeyboardState)
      window.removeEventListener('focusin', updateKeyboardState)
      window.removeEventListener('focusout', updateKeyboardState)
    }
  }, [])

  if (isKeyboardOpen) {
    return null
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/94 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 shadow-[0_-12px_24px_rgba(2,6,23,0.12)] backdrop-blur md:hidden">
      <p className="mb-2 text-center text-[11px] text-muted-foreground">
        {hasParserError ? 'Corrige el error de parseo para ejecutar.' : 'Accion principal en zona ergonomica (pulgar).'}
      </p>
      <Button type="button" className="w-full" onClick={() => void onRun()} disabled={disabled}>
        {statusText}
      </Button>
    </div>
  )
}
