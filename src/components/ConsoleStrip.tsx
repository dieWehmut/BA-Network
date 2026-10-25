type Props = {
  /** Command currently being displayed in the prompt, e.g. "help". */
  command: string
  /** Status tokens shown under the prompt, e.g. ["console", "night", "green"]. */
  tokens: string[]
  /** Right-hand hint such as the generation status. */
  hint?: string
}

/**
 * Console command strip: a prompt marker on the left, status tokens
 * underneath, mirroring the dock at the bottom of dieWehmut.github.io.
 */
export default function ConsoleStrip({ command, tokens, hint }: Props) {
  return (
    <>
      <div className="console-strip">
        <span className="console-strip__symbol" aria-hidden="true">
          &gt;_
        </span>
        <span className="console-strip__label">{command}</span>
        {hint && <span className="console-strip__meta">{hint}</span>}
      </div>
      <div className="console-breadcrumb" aria-label="Active settings">
        <span className="console-breadcrumb__sep">/</span>
        {tokens.map((token) => (
          <span className="console-breadcrumb__token" key={token}>
            {token}
          </span>
        ))}
      </div>
    </>
  )
}
