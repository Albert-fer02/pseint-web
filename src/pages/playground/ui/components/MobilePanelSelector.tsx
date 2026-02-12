import {
  getMobilePanelSectionId,
  getMobilePanelTabId,
  mobilePanels,
  type MobilePanelKey,
} from '@/pages/playground/model/playgroundUiConfig'
import { cn } from '@/shared/lib/utils'

interface MobilePanelSelectorProps {
  active: MobilePanelKey
  onChange: (panel: MobilePanelKey) => void
}

export function MobilePanelSelector({ active, onChange }: MobilePanelSelectorProps) {
  return (
    <section className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Panel activo</p>
      <div className="-mx-1 overflow-x-auto px-1 pb-1 md:mx-0 md:overflow-visible md:px-0">
        <div
          className="inline-flex min-w-max gap-2 rounded-xl border border-border/80 bg-card/80 p-1 md:min-w-0 md:flex-wrap"
          role="tablist"
          aria-label="Paneles de apoyo"
        >
          {mobilePanels.map((panel) => (
            <button
              key={panel.key}
              type="button"
              id={getMobilePanelTabId(panel.key)}
              role="tab"
              aria-selected={active === panel.key}
              aria-controls={getMobilePanelSectionId(panel.key)}
              className={cn(
                'h-10 shrink-0 rounded-lg px-3 text-xs font-medium transition-colors motion-spring md:text-[11px]',
                active === panel.key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
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
        aria-label="Seleccionar panel activo"
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
