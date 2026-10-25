import type { Theme } from '../utils/theme'

type Props = {
  theme: Theme
  onToggleTheme: () => void
  repoUrl: string
}

/** Console chrome bar: brand marker on the left, controls on the right. */
export default function ConsoleHeader({ theme, onToggleTheme, repoUrl }: Props) {
  return (
    <header className="console-chrome">
      <div className="console-chrome__brand">
        <span aria-hidden="true">&gt;_</span>
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
