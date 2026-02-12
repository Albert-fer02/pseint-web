import { mobilePanels, type MobilePanelKey } from '@/pages/playground/model/playgroundUiConfig'
import { cn } from '@/shared/lib/utils'

interface MobilePanelSelectorProps {
  active: MobilePanelKey
  onChange: (panel: MobilePanelKey) => void
}

export function MobilePanelSelector({ active, onChange }: MobilePanelSelectorProps) {
  return (
    <section className="space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Panel visible</p>
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="inline-flex min-w-full gap-2 rounded-xl border border-border/80 bg-card/80 p-1">
          {mobilePanels.map((panel) => (
            <button
              key={panel.key}
              type="button"
              className={cn(
                'h-10 shrink-0 rounded-lg px-3 text-xs font-medium transition-colors motion-spring',
                active === panel.key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
              aria-pressed={active === panel.key}
              onClick={() => onChange(panel.key)}
            >
              {panel.label}
            </button>
          ))}
        </div>
      </div>

      <select
        className="sr-only"
        value={active}
        onChange={(event) => onChange(event.target.value as MobilePanelKey)}
        aria-label="Seleccionar panel visible"
      >
        {mobilePanels.map((panel) => (
          <option key={panel.key} value={panel.key}>
            {panel.label}
          </option>
        ))}
      </select>
    </section>
  )
}
