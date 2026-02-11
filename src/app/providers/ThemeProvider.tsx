import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react'

const THEME_STORAGE_KEY = 'pseint-lab-theme'

export type ThemeMode = 'light' | 'oled'

interface ThemeContextValue {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function resolveInitialTheme(): ThemeMode {
  try {
    const persisted = localStorage.getItem(THEME_STORAGE_KEY)
    if (persisted === 'light' || persisted === 'oled') {
      return persisted
    }
  } catch {
    // ignore storage read failures and fallback to media query
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oled' : 'light'
}

function applyThemeClass(theme: ThemeMode): void {
  const root = document.documentElement
  root.classList.remove('theme-light', 'theme-oled')
  root.classList.add(theme === 'oled' ? 'theme-oled' : 'theme-light')
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setThemeState] = useState<ThemeMode>(resolveInitialTheme)

  useEffect(() => {
    applyThemeClass(theme)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // ignore storage write failures
    }
  }, [theme])

  const setTheme = useCallback((nextTheme: ThemeMode) => {
    setThemeState(nextTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((currentTheme) => (currentTheme === 'light' ? 'oled' : 'light'))
  }, [])

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
    }),
    [setTheme, theme, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider')
  }
  return context
}
