import { Outlet } from '@tanstack/react-router'
import { ThemeToggle } from '@/features/theme/ui/ThemeToggle'

export function RootLayout() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Saltar al contenido
      </a>

      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/94 md:bg-background/82 md:backdrop-blur">
        <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4 md:px-6 md:py-4">
          <div className="min-w-0 space-y-1 pr-24 sm:pr-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">PSeInt Learning Studio</p>
            <h1 className="text-base font-semibold leading-tight tracking-tight sm:text-xl md:text-2xl">
              Aprende, practica y ejecuta en un solo flujo
            </h1>
            <p className="text-xs text-muted-foreground">Diseñado para progresión por etapas con feedback inmediato.</p>
          </div>

          <div className="absolute right-3 top-3 sm:static sm:right-auto sm:top-auto">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main
        id="main-content"
        className="mx-auto w-full max-w-7xl px-3 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:px-4 md:px-6 md:py-7 md:pb-8"
      >
        <Outlet />
      </main>
    </div>
  )
}
