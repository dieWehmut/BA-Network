import { useState } from 'react'
import '../styles/Home.css'
import NetworkGraph from '../components/NetworkGraph'
import DegreeHistogram from '../components/DegreeHistogram'
import ControlsPanel from '../components/ControlsPanel'
import Footer from '../components/Footer'
import type { Node as BANode, Link as BALink } from '../utils/ba'

export default function Home() {
  // increase defaults so graphs are denser by default
  const [initialNodes, setInitialNodes] = useState(10)
  const [attachPerStep, setAttachPerStep] = useState(3)
  const [steps, setSteps] = useState(150)
  const [generationId, setGenerationId] = useState(0)
  const [pauseSignal, setPauseSignal] = useState(0)
  const [resumeSignal, setResumeSignal] = useState(0)
  const [speed, setSpeed] = useState(300)

  const [nodes, setNodes] = useState<BANode[]>([])
  const [links, setLinks] = useState<BALink[]>([])

  return (
    <div className="home-root">
      <div className="home-header">
        <h2>BA Network Visualization</h2>
      </div>
      <div className="home-main">
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
          width={720}
          height={360}
        />

        <DegreeHistogram nodes={nodes} links={links} width={1880} height={360} />
      </div>

      <div className="home-controls">
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
            setInitialNodes(10)
            setAttachPerStep(3)
            setSteps(150)
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
