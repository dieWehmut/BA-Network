import { useEffect, useState } from 'react'
import '../styles/ControlPanel.css'
import Footer from './Footer'

// Controls panel: sliders and buttons, closed by the project meta rows.
type Props = {
  initialNodes: number
  attachPerStep: number
  steps: number
  onChange: (patch: { initialNodes?: number; attachPerStep?: number; steps?: number }) => void
  onGenerate: () => void
  onReset: () => void
  onPause?: () => void
  onResume?: () => void
  speed: number
  onSpeedChange: (v: number) => void
  repoUrl?: string
}

export default function ControlsPanel({
  initialNodes,
  attachPerStep,
  steps,
  onChange,
  onGenerate,
  onReset,
  onPause,
  onResume,
  speed,
  onSpeedChange,
  repoUrl,
}: Props) {
  const [expanded, setExpanded] = useState<boolean>(true)

  // collapse controls by default on small screens
  useEffect(() => {
    function onResize() {
      setExpanded(window.innerWidth > 680)
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <div className="controls-panel">
      <div className="controls-panel__head">
        <strong>Controls</strong>
        <button
          className="console-button console-button--ghost"
          type="button"
          onClick={() => setExpanded((s) => !s)}
          aria-expanded={expanded}
        >
          {expanded ? 'hide' : 'show'}
        </button>
      </div>
      {expanded && (
        <>
          <div className="controls-panel__body">
            <label className="control-field">
              <span className="control-field__label">
                Initial nodes <strong>{initialNodes}</strong>
              </span>
              <input
                type="range"
                min={1}
                max={200}
                value={initialNodes}
                onChange={(e) => onChange({ initialNodes: Number(e.target.value) })}
              />
            </label>

            <label className="control-field">
              <span className="control-field__label">
                Attach per step <strong>{attachPerStep}</strong>
              </span>
              <input
                type="range"
                min={1}
                max={10}
                value={attachPerStep}
                onChange={(e) => onChange({ attachPerStep: Number(e.target.value) })}
              />
            </label>

            <label className="control-field">
              <span className="control-field__label">
                Steps <strong>{steps}</strong>
              </span>
              <input
                type="range"
                min={0}
                max={1000}
                value={steps}
                onChange={(e) => onChange({ steps: Number(e.target.value) })}
              />
            </label>
          </div>

          <div className="controls-panel__actions">
            <button className="console-button" type="button" onClick={onGenerate}>
              generate
            </button>
            <button className="console-button console-button--ghost" type="button" onClick={onReset}>
              reset
            </button>
            <button className="console-button console-button--ghost" type="button" onClick={onPause} title="Pause generation">
              pause
            </button>
            <button className="console-button console-button--ghost" type="button" onClick={onResume} title="Resume from paused position">
              resume
            </button>
            <label className="controls-panel__speed">
              <span>Speed (ms)</span>
              <input
                type="range"
                min={50}
                max={2000}
                value={speed}
                onChange={(e) => onSpeedChange(Number(e.target.value))}
              />
              <strong>{speed}</strong>
            </label>
          </div>
        </>
      )}
      {/* Meta rows close the box, so the page needs no footer strip. */}
      <Footer repoUrl={repoUrl} />
    </div>
  )
}
