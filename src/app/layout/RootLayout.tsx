import { Outlet } from '@tanstack/react-router'
import { ThemeToggle } from '@/features/theme/ui/ThemeToggle'
import { Badge } from '@/shared/ui/badge'

export function RootLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Saltar al contenido
      </a>

      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">PSeInt Lab</p>
            <h1 className="text-xl font-semibold tracking-tight md:text-2xl">Editor + Ejecucion + Diagrama</h1>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="hidden md:inline-flex">
              Arquitectura escalable
            </Badge>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main id="main-content" className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <Outlet />
      </main>
    </div>
  )
}
