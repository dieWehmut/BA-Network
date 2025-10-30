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

export default function ControlsPanel({ initialNodes, attachPerStep, steps, onChange, onGenerate, onReset, onPause, onResume, speed, onSpeedChange }: Props) {
  return (
    <div className="controls-panel" style={{ padding: 12, border: '1px solid #eee' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <label style={{ width: 140 }}>
          Initial nodes: {initialNodes}
          <input
            type="range"
            min={1}
            max={50}
            value={initialNodes}
            onChange={(e) => onChange({ initialNodes: Number(e.target.value) })}
          />
        </label>

        <label style={{ width: 220 }}>
          Attach per step: {attachPerStep}
          <input
            type="range"
            min={1}
            max={10}
            value={attachPerStep}
            onChange={(e) => onChange({ attachPerStep: Number(e.target.value) })}
          />
        </label>

        <label style={{ width: 220 }}>
          Steps: {steps}
          <input type="range" min={0} max={500} value={steps} onChange={(e) => onChange({ steps: Number(e.target.value) })} />
        </label>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={onGenerate}>生成</button>
          <button onClick={onReset}>重置</button>
          <button onClick={onPause} title="暂停生成">暂停</button>
          <button onClick={onResume} title="从暂停位置继续">继续</button>
          <label style={{ marginLeft: 8 }}>
            速度(ms): {speed}
            <input type="range" min={50} max={2000} value={speed} onChange={(e) => onSpeedChange(Number(e.target.value))} />
          </label>
        </div>
      </div>
    </div>
  )
}
