export type MobilePanelKey = 'practice' | 'inputs' | 'insights' | 'output' | 'diagram' | 'ai'

export const mobilePanels: Array<{ key: MobilePanelKey; label: string }> = [
  { key: 'practice', label: 'Practica' },
  { key: 'inputs', label: 'Entradas' },
  { key: 'output', label: 'Salida' },
  { key: 'insights', label: 'Metricas' },
  { key: 'diagram', label: 'Diagrama' },
  { key: 'ai', label: 'Tutor IA' },
]

const MOBILE_PANEL_SCROLL_ID_PREFIX = 'mobile-panel'
export const MOBILE_KEYBOARD_DELTA_THRESHOLD = 140
export const AUTOSAVE_DELAY_MS = 450

export const quickSnippets: Array<{ id: string; label: string; content: string }> = [
  { id: 'si', label: 'Si', content: 'Si condicion Entonces\n    \nFinSi' },
  { id: 'si-sino', label: 'Si/Sino', content: 'Si condicion Entonces\n    \nSino\n    \nFinSi' },
  { id: 'para', label: 'Para', content: 'Para i <- 1 Hasta 10 Con Paso 1 Hacer\n    \nFinPara' },
  { id: 'mientras', label: 'Mientras', content: 'Mientras condicion Hacer\n    \nFinMientras' },
  { id: 'constante', label: 'Constante', content: 'Constante NOMBRE <- 0;' },
  { id: 'subproceso', label: 'SubProceso', content: 'SubProceso nombre(parametro)\n    \nFinSubProceso' },
  { id: 'escribir', label: 'Escribir', content: 'Escribir "";' },
]

export function getMobilePanelSectionId(panel: MobilePanelKey): string {
  return `${MOBILE_PANEL_SCROLL_ID_PREFIX}-${panel}`
}
