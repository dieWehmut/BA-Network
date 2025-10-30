import { useState } from 'react'
import NetworkGraph from '../components/NetworkGraph'
import DegreeHistogram from '../components/DegreeHistogram'
import ControlsPanel from '../components/ControlsPanel'
import Footer from '../components/Footer'

export default function Home() {
  const [initialNodes, setInitialNodes] = useState(5)
  const [attachPerStep, setAttachPerStep] = useState(2)
  const [steps, setSteps] = useState(50)
  const [generationId, setGenerationId] = useState(0)
  const [pauseSignal, setPauseSignal] = useState(0)
  const [resumeSignal, setResumeSignal] = useState(0)
  const [speed, setSpeed] = useState(600)

  const [nodes, setNodes] = useState<any[]>([])
  const [links, setLinks] = useState<any[]>([])

  return (
    <div style={{ padding: 1 }}>
      <h2>BA Network Visualization</h2>
      <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
        <NetworkGraph
          initialNodes={initialNodes}
          attachPerStep={attachPerStep}
          steps={steps}
          generationId={generationId}
          pauseSignal={pauseSignal}
          resumeSignal={resumeSignal}
          tickDelay={speed}
          onNodesUpdate={(ns, ls) => {
            setNodes(ns)
            setLinks(ls)
          }}
          width={800}
          height={500}
        />

        <DegreeHistogram nodes={nodes} links={links} width={360} height={500} />
      </div>

      <div style={{ marginTop: 2 }}>
        <ControlsPanel
          initialNodes={initialNodes}
          attachPerStep={attachPerStep}
          steps={steps}
          onChange={(patch) => {
            if (patch.initialNodes !== undefined) setInitialNodes(patch.initialNodes)
            if (patch.attachPerStep !== undefined) setAttachPerStep(patch.attachPerStep)
            if (patch.steps !== undefined) setSteps(patch.steps)
          }}
          onGenerate={() => setGenerationId((id) => id + 1)}
          onReset={() => {
            setInitialNodes(5)
            setAttachPerStep(2)
            setSteps(50)
            setGenerationId((id) => id + 1)
          }}
          onPause={() => setPauseSignal((s) => s + 1)}
          onResume={() => setResumeSignal((s) => s + 1)}
          speed={speed}
          onSpeedChange={(v) => setSpeed(v)}
        />
      </div>

      <Footer />
    </div>
  )
}
