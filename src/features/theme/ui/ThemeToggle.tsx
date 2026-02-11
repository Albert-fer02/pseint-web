import { MoonStar, Sun } from 'lucide-react'
import { useTheme } from '@/app/providers/ThemeProvider'
import { Button } from '@/shared/ui/button'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="inline-flex items-center rounded-xl border border-border bg-card p-1 shadow-xs">
      <Button
        type="button"
        variant={theme === 'light' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => setTheme('light')}
        aria-label="Activar modo claro"
        aria-pressed={theme === 'light'}
        className="rounded-lg px-3"
      >
        <Sun className="h-4 w-4" />
        Claro
      </Button>
      <Button
        type="button"
        variant={theme === 'oled' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => setTheme('oled')}
        aria-label="Activar modo OLED dark"
        aria-pressed={theme === 'oled'}
        className="rounded-lg px-3"
      >
        <MoonStar className="h-4 w-4" />
        OLED
      </Button>
    </div>
  )
}
