export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'theme'

/** Read the persisted theme (defaults to the dark console palette). */
export function getTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch (error) {
    void error
  }
  return 'dark'
}

/** Apply a theme to the document and remember the choice. */
export function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  root.style.colorScheme = theme
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch (error) {
    void error
  }
}

export function toggleTheme(current: Theme): Theme {
  const next: Theme = current === 'dark' ? 'light' : 'dark'
  applyTheme(next)
  return next
}
