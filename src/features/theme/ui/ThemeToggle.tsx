import { MoonStar, Sun } from 'lucide-react'
import { useTheme } from '@/app/providers/ThemeProvider'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib/utils'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div
      className={cn(
        'inline-flex max-w-full items-center gap-1 rounded-full border border-border/85 bg-card/92 p-1',
        'shadow-[0_8px_24px_rgba(2,6,23,0.14)]',
        'supports-[backdrop-filter]:bg-card/72 supports-[backdrop-filter]:backdrop-blur',
        'motion-spring',
      )}
    >
      <Button
        type="button"
        variant={theme === 'light' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => setTheme('light')}
        aria-label="Activar modo claro"
        aria-pressed={theme === 'light'}
        className={cn(
          'h-9 rounded-full px-2.5 min-[380px]:px-3 md:h-10',
          theme === 'light' ? 'shadow-sm ring-1 ring-border/70' : 'text-muted-foreground',
        )}
      >
        <Sun className="h-4 w-4" />
        <span className="hidden min-[420px]:inline md:inline">Claro</span>
      </Button>
      <Button
        type="button"
        variant={theme === 'oled' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => setTheme('oled')}
        aria-label="Activar modo OLED dark"
        aria-pressed={theme === 'oled'}
        className={cn(
          'h-9 rounded-full px-2.5 min-[380px]:px-3 md:h-10',
          theme === 'oled' ? 'shadow-sm ring-1 ring-border/70' : 'text-muted-foreground',
        )}
      >
        <MoonStar className="h-4 w-4" />
        <span className="hidden min-[420px]:inline md:inline">OLED</span>
      </Button>
    </div>
  )
}
