import type { ReactNode } from 'react'

export type ConsoleRow = { label: string; value: ReactNode }
export type ConsoleStat = { label: string; value: ReactNode }

type Props = {
  /** Uppercase section marker, e.g. "LINKS". */
  title: string
  /** Label / value rows (terminal style). */
  rows?: ConsoleRow[]
  /** Big accent-coloured figures. */
  stats?: ConsoleStat[]
  children?: ReactNode
}

/**
 * A console block: uppercase accent title followed by either terminal rows or
 * a grid of figures. Mirrors the sections on dieWehmut.github.io.
 */
export default function ConsoleSection({ title, rows, stats, children }: Props) {
  return (
    <section className="console-section">
      <div className="console-section__title">{title}</div>
      {rows && rows.length > 0 && (
        <dl className="console-section__rows">
          {rows.map((row) => (
            <div className="console-row" key={row.label}>
              <dt className="console-row__label">{row.label}</dt>
              <dd className="console-row__value">{row.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {stats && stats.length > 0 && (
        <div className="console-section__stats">
          {stats.map((stat) => (
            <div className="console-stat" key={stat.label}>
              <span className="console-stat__label">{stat.label}</span>
              <strong className="console-stat__value">{stat.value}</strong>
            </div>
          ))}
        </div>
      )}
      {children}
    </section>
  )
}
