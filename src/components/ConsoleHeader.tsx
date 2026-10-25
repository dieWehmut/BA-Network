import type { Theme } from '../utils/theme'

type Props = {
  theme: Theme
  onToggleTheme: () => void
  repoUrl: string
}

/** Page header: brand marker on the left, theme switch on the right. */
export default function ConsoleHeader({ theme, onToggleTheme, repoUrl }: Props) {
  return (
    <header className="console-chrome">
      <div className="console-chrome__brand">
        <span className="console-chrome__mark" aria-hidden="true" />
        <strong>BA-Network</strong>
      </div>
      <div className="console-chrome__actions">
        <a className="console-button" href={repoUrl} target="_blank" rel="noreferrer">
          github
        </a>
        <button
          className="console-button"
          type="button"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        >
          {theme}
        </button>
      </div>
    </header>
  )
}
