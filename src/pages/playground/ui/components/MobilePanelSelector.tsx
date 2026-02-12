import { mobilePanels, type MobilePanelKey } from '@/pages/playground/model/playgroundUiConfig'

interface MobilePanelSelectorProps {
  active: MobilePanelKey
  onChange: (panel: MobilePanelKey) => void
}

export function MobilePanelSelector({ active, onChange }: MobilePanelSelectorProps) {
  const selectorId = 'mobile-panel-selector'

  return (
    <label className="block space-y-1.5" htmlFor={selectorId}>
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Panel visible</span>
      <select
        id={selectorId}
        className="h-11 w-full rounded-lg border border-border bg-card px-3 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        value={active}
        onChange={(event) => onChange(event.target.value as MobilePanelKey)}
      >
        {mobilePanels.map((panel) => (
          <option key={panel.key} value={panel.key}>
            {panel.label}
          </option>
        ))}
      </select>
    </label>
  )
}
