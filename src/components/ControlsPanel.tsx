import { useEffect, useState } from 'react'

// Controls panel: sliders and buttons
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
}

import '../styles/ControlPanel.css'

export default function ControlsPanel({ initialNodes, attachPerStep, steps, onChange, onGenerate, onReset, onPause, onResume, speed, onSpeedChange }: Props) {
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <strong>Controls</strong>
        <button onClick={() => setExpanded((s) => !s)} style={{ marginLeft: 'auto' }}>{expanded ? 'Hide' : 'Show'}</button>
      </div>
      {expanded && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={{ minWidth: 140 }}>
          Initial nodes: <strong>{initialNodes}</strong>
          <input
            type="range"
            min={1}
            max={200}
            value={initialNodes}
            onChange={(e) => onChange({ initialNodes: Number(e.target.value) })}
          />
        </label>

        <label style={{ minWidth: 160 }}>
          Attach per step: <strong>{attachPerStep}</strong>
          <input
            type="range"
            min={1}
            max={10}
            value={attachPerStep}
            onChange={(e) => onChange({ attachPerStep: Number(e.target.value) })}
          />
        </label>

        <label style={{ minWidth: 160 }}>
          Steps: <strong>{steps}</strong>
          <input type="range" min={0} max={1000} value={steps} onChange={(e) => onChange({ steps: Number(e.target.value) })} />
        </label>

        <div className="actions" style={{ marginLeft: 'auto' }}>
          <button onClick={onGenerate}>Generate</button>
          <button onClick={onReset}>Reset</button>
          <button onClick={onPause} title="Pause generation">Pause</button>
          <button onClick={onResume} title="Resume from paused position">Resume</button>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Speed (ms):</span>
            <input type="range" min={50} max={2000} value={speed} onChange={(e) => onSpeedChange(Number(e.target.value))} />
            <strong style={{ minWidth: 48, textAlign: 'right' }}>{speed}</strong>
          </label>
        </div>
        </div>
      )}
    </div>
  )
}
