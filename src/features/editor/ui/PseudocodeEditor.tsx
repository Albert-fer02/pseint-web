import CodeMirror from '@uiw/react-codemirror'
import { keymap } from '@codemirror/view'
import { pseintHighlighting, pseintLanguage } from '@/features/editor/model/pseintLanguage'
import { useTheme } from '@/app/providers/ThemeProvider'

interface PseudocodeEditorProps {
  value: string
  onChange: (nextValue: string) => void
  onRunShortcut?: () => void
}

export function PseudocodeEditor({ value, onChange, onRunShortcut }: PseudocodeEditorProps) {
  const { theme } = useTheme()

  return (
    <div className="pseint-editor-shell overflow-hidden rounded-xl border border-border bg-card">
      <CodeMirror
        value={value}
        height="var(--editor-height)"
        extensions={[
          pseintLanguage,
          pseintHighlighting,
          keymap.of([
            {
              key: 'Mod-Enter',
              run: () => {
                onRunShortcut?.()
                return true
              },
            },
          ]),
        ]}
        theme={theme === 'oled' ? 'dark' : 'light'}
        basicSetup={{
          lineNumbers: true,
          foldGutter: false,
          highlightActiveLine: true,
          highlightSelectionMatches: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: false,
        }}
        onChange={onChange}
      />
    </div>
  )
}
