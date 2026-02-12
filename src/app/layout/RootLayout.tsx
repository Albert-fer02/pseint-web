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

      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-3 py-2.5 sm:px-4 md:px-6 md:py-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">PSeInt Learning Studio</p>
            <h1 className="truncate text-sm font-semibold leading-tight tracking-tight sm:text-base md:text-lg">
              Practica guiada + editor en un flujo unico
            </h1>
          </div>

          <ThemeToggle />
        </div>
      </header>

      <main
        id="main-content"
        className="mx-auto w-full max-w-7xl px-3 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:px-4 md:px-6 md:py-6 md:pb-8"
      >
        <Outlet />
      </main>
    </div>
  )
}
