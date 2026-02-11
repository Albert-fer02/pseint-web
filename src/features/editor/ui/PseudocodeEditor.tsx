import { linter, lintGutter, type Diagnostic } from '@codemirror/lint'
import CodeMirror from '@uiw/react-codemirror'
import { useMemo } from 'react'
import { EditorView, keymap } from '@codemirror/view'
import { pseintAutocompletion, pseintHighlighting, pseintLanguage } from '@/features/editor/model/pseintLanguage'
import { useTheme } from '@/app/providers/ThemeProvider'

interface PseudocodeEditorProps {
  value: string
  onChange: (nextValue: string) => void
  onRunShortcut?: () => void
  parserErrorLine?: number | null
  parserErrorMessage?: string | null
}

const INDENT_UNIT = '    '
const BLOCK_START_PATTERN = /^(si\b.*\bentonces|para\b.*\bhacer|mientras\b.*\bhacer|repetir\b|algoritmo\b|funcion\b|subproceso\b|sino\b)/i

export function PseudocodeEditor({
  value,
  onChange,
  onRunShortcut,
  parserErrorLine = null,
  parserErrorMessage = null,
}: PseudocodeEditorProps) {
  const { theme } = useTheme()
  const parserDiagnostics = useMemo(
    () => createParserDiagnostics(parserErrorLine, parserErrorMessage),
    [parserErrorLine, parserErrorMessage],
  )
  const parserLinter = useMemo(
    () =>
      linter(
        (view) =>
          parserDiagnostics.map((diagnostic) => {
            const line = clampLineNumber(diagnostic.line, view.state.doc.lines)
            const lineInfo = view.state.doc.line(line)

            return {
              from: lineInfo.from,
              to: Math.max(lineInfo.to, lineInfo.from + 1),
              severity: 'error',
              source: 'parser',
              message: diagnostic.message,
            } satisfies Diagnostic
          }),
        { delay: 0 },
      ),
    [parserDiagnostics],
  )

  return (
    <div className="pseint-editor-shell overflow-hidden rounded-xl border border-border bg-card">
      <CodeMirror
        value={value}
        height="var(--editor-height)"
        extensions={[
          pseintLanguage,
          pseintHighlighting,
          pseintAutocompletion,
          lintGutter(),
          parserLinter,
          EditorView.lineWrapping,
          keymap.of([
            {
              key: 'Enter',
              run: (view) => {
                const selection = view.state.selection.main
                if (!selection.empty) {
                  return false
                }

                const cursor = selection.head
                const line = view.state.doc.lineAt(cursor)
                const cursorOffset = cursor - line.from
                const beforeCursor = line.text.slice(0, cursorOffset)
                const baseIndent = beforeCursor.match(/^\s*/)?.[0] ?? ''
                const shouldIncreaseIndent = BLOCK_START_PATTERN.test(beforeCursor.trim())
                const nextIndent = shouldIncreaseIndent ? `${baseIndent}${INDENT_UNIT}` : baseIndent
                const insertion = `\n${nextIndent}`

                view.dispatch({
                  changes: { from: cursor, to: cursor, insert: insertion },
                  selection: { anchor: cursor + insertion.length },
                  userEvent: 'input',
                })
                return true
              },
            },
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
          indentOnInput: true,
        }}
        onChange={onChange}
      />
    </div>
  )
}

function createParserDiagnostics(
  parserErrorLine: number | null,
  parserErrorMessage: string | null,
): Array<{ line: number; message: string }> {
  if (!parserErrorLine || !parserErrorMessage) {
    return []
  }

  return [{ line: parserErrorLine, message: parserErrorMessage }]
}

function clampLineNumber(line: number, maxLines: number): number {
  if (line < 1) {
    return 1
  }
  if (line > maxLines) {
    return maxLines
  }
  return line
}
