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
  return (
    <div className="controls-panel">
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
          <button onClick={onGenerate}>生成</button>
          <button onClick={onReset}>重置</button>
          <button onClick={onPause} title="暂停生成">暂停</button>
          <button onClick={onResume} title="从暂停位置继续">继续</button>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>速度(ms):</span>
            <input type="range" min={50} max={2000} value={speed} onChange={(e) => onSpeedChange(Number(e.target.value))} />
            <strong style={{ minWidth: 48, textAlign: 'right' }}>{speed}</strong>
          </label>
        </div>
      </div>
    </div>
  )
}
